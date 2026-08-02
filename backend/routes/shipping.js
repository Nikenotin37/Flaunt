const express = require('express');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '', {
  auth: { autoRefreshToken: false, persistSession: false },
});
const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';
let cachedToken = null;
let tokenExpiresAt = 0;

async function getShiprocketToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const response = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
  });
  const data = await response.json();
  if (!response.ok || !data.token) throw new Error(data.message || 'Shiprocket authentication failed');
  cachedToken = data.token;
  tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

async function shiprocketRequest(path, options = {}) {
  const token = await getShiprocketToken();
  const response = await fetch(`${SHIPROCKET_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Shiprocket request failed');
  return data;
}

async function getOrderForUser(orderId, userId) {
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error) throw error;
  const { data: product, error: productError } = await supabase.from('products').select('id, name, price, store_id').eq('id', order.product_id).single();
  if (productError) throw productError;
  const { data: store, error: storeError } = await supabase.from('stores').select('id, seller_id').eq('id', product.store_id).single();
  if (storeError) throw storeError;
  if (store.seller_id !== userId) {
    const isBuyer = order.buyer_id === userId;
    if (!isBuyer) return null;
  }
  return { order, product, store };
}

router.post('/create', requireAuth, async (req, res, next) => {
  try {
    const { orderId, weight = 0.5, length = 20, breadth = 15, height = 10 } = req.body;
    const values = [weight, length, breadth, height].map(Number);
    if (!orderId || values.some((value) => !Number.isFinite(value) || value <= 0)) return res.status(400).json({ success: false, error: 'Valid orderId and parcel dimensions are required' });

    const details = await getOrderForUser(orderId, req.user.id);
    if (!details || details.store.seller_id !== req.user.id) return res.status(403).json({ success: false, error: 'Only the seller can create this shipment' });
    if (details.order.payment_status !== 'paid') return res.status(400).json({ success: false, error: 'Order has not been paid' });

    const { data: existing } = await supabase.from('shipments').select('*').eq('order_id', orderId).maybeSingle();
    if (existing) return res.json({ success: true, shipment: existing, alreadyCreated: true });

    const { data: address, error: addressError } = await supabase.from('addresses').select('*').eq('id', details.order.address_id).single();
    if (addressError) throw addressError;
    const shipData = await shiprocketRequest('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify({
        order_id: String(orderId), order_date: new Date().toISOString().slice(0, 10),
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
        billing_customer_name: address.full_name, billing_address: address.address_line1,
        billing_city: address.city, billing_state: address.state, billing_pincode: address.pincode,
        billing_phone: address.phone, shipping_is_billing: true,
        order_items: [{ name: details.product.name, units: 1, selling_price: details.product.price }],
        payment_method: 'Prepaid', sub_total: details.product.price,
        length: values[1], breadth: values[2], height: values[3], weight: values[0],
      }),
    });
    if (!shipData.order_id || !shipData.shipment_id) throw new Error('Shiprocket did not return shipment identifiers');

    const { data: shipment, error: shipmentError } = await supabase.from('shipments').insert({
      order_id: orderId, shiprocket_order_id: String(shipData.order_id), shiprocket_shipment_id: String(shipData.shipment_id), current_status: 'booked',
    }).select().single();
    if (shipmentError) throw shipmentError;
    await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId);
    res.json({ success: true, shipment, shipData });
  } catch (error) { next(error); }
});

router.post('/assign-courier', requireAuth, async (req, res, next) => {
  try {
    const { shipmentId, courierId } = req.body;
    if (!shipmentId || !courierId) return res.status(400).json({ success: false, error: 'shipmentId and courierId are required' });
    const { data: shipment, error } = await supabase.from('shipments').select('*').eq('shiprocket_shipment_id', String(shipmentId)).single();
    if (error) throw error;
    const details = await getOrderForUser(shipment.order_id, req.user.id);
    if (!details || details.store.seller_id !== req.user.id) return res.status(403).json({ success: false, error: 'Not allowed' });
    const result = await shiprocketRequest('/shipments/assign/courier', { method: 'POST', body: JSON.stringify({ shipment_id: [shipmentId], courier_id: courierId }) });
    await supabase.from('shipments').update({ current_status: 'courier_assigned' }).eq('id', shipment.id);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/track/:awbCode', requireAuth, async (req, res, next) => {
  try { const data = await shiprocketRequest(`/courier/track/awb/${encodeURIComponent(req.params.awbCode)}`, { method: 'GET' }); res.json(data.tracking_data || data); } catch (error) { next(error); }
});

router.get('/couriers', requireAuth, async (req, res, next) => {
  try {
    const { pickup_pincode, delivery_pincode, weight } = req.query;
    if (!pickup_pincode || !delivery_pincode || !weight) return res.status(400).json({ success: false, error: 'pickup_pincode, delivery_pincode and weight are required' });
    const data = await shiprocketRequest(`/courier/serviceability/?pickup_postcode=${encodeURIComponent(pickup_pincode)}&delivery_postcode=${encodeURIComponent(delivery_pincode)}&weight=${encodeURIComponent(weight)}&cod=0`, { method: 'GET' });
    res.json(data.data?.available_courier_companies || []);
  } catch (error) { next(error); }
});

module.exports = router;
