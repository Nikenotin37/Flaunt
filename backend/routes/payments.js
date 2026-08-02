const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '', {
  auth: { autoRefreshToken: false, persistSession: false },
});

function sha512(value) {
  return crypto.createHash('sha512').update(value).digest('hex');
}

function sameHash(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function redirectToApp(path) {
  const base = process.env.APP_URL || 'flaunt://';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function payuHash({ txnid, amount, productinfo, firstname, email }) {
  const value = [
    process.env.PAYU_MERCHANT_KEY, txnid, amount, productinfo, firstname, email,
    '', '', '', '', '', '', '', '', '', process.env.PAYU_SALT,
  ].join('|');
  return sha512(value);
}

function payuReverseHash({ status, email, firstname, productinfo, amount, txnid }) {
  return sha512([
    process.env.PAYU_SALT, status, '', '', '', '', '', '', '', '', '', '', '',
    email, firstname, productinfo, amount, txnid, process.env.PAYU_MERCHANT_KEY,
  ].join('|'));
}

router.post('/create-order', requireAuth, async (req, res, next) => {
  try {
    const { productId, addressId, buyerName, buyerEmail, buyerPhone, deliveryCharges = 0 } = req.body;
    if (!productId || !addressId || !buyerName || !buyerEmail || !buyerPhone) {
      return res.status(400).json({ success: false, error: 'productId, addressId, buyerName, buyerEmail and buyerPhone are required' });
    }

    const delivery = Number(deliveryCharges);
    if (!Number.isFinite(delivery) || delivery < 0) {
      return res.status(400).json({ success: false, error: 'Invalid delivery charges' });
    }

    const { data: product, error: productError } = await supabase
      .from('products').select('id, name, price, status, store_id').eq('id', productId).maybeSingle();
    if (productError) throw productError;
    if (!product || product.status !== 'active') return res.status(404).json({ success: false, error: 'Product is not available' });

    const { data: store, error: storeError } = await supabase
      .from('stores').select('id, seller_id').eq('id', product.store_id).single();
    if (storeError) throw storeError;
    if (store.seller_id === req.user.id) return res.status(400).json({ success: false, error: 'You cannot buy your own product' });

    const { data: address, error: addressError } = await supabase
      .from('addresses').select('id').eq('id', addressId).eq('user_id', req.user.id).maybeSingle();
    if (addressError) throw addressError;
    if (!address) return res.status(403).json({ success: false, error: 'Address does not belong to this buyer' });

    const grossAmount = Number(product.price) + delivery;
    const commissionRate = Number(process.env.COMMISSION_RATE || 10) / 100;
    const commissionAmount = Number((grossAmount * commissionRate).toFixed(2));
    const sellerAmount = Number((grossAmount - commissionAmount).toFixed(2));
    const txnid = `FLAUNT_${crypto.randomUUID()}`;
    const amount = grossAmount.toFixed(2);

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      product_id: product.id,
      buyer_id: req.user.id,
      // Existing FLAUNT order screens treat orders.seller_id as the store id.
      seller_id: product.store_id,
      address_id: address.id,
      amount: grossAmount,
      delivery_charges: delivery,
      commission_amount: commissionAmount,
      seller_amount: sellerAmount,
      payu_transaction_id: txnid,
      payment_status: 'pending',
      status: 'pending',
    }).select('id').single();
    if (orderError) throw orderError;

    res.json({
      success: true,
      orderId: order.id,
      payuData: {
        key: process.env.PAYU_MERCHANT_KEY,
        txnid,
        amount,
        productinfo: product.name,
        firstname: buyerName,
        email: buyerEmail,
        phone: buyerPhone,
        surl: `${process.env.BACKEND_URL}/api/payments/success`,
        furl: `${process.env.BACKEND_URL}/api/payments/failure`,
        hash: payuHash({ txnid, amount, productinfo: product.name, firstname: buyerName, email: buyerEmail }),
      },
    });
  } catch (error) { next(error); }
});

async function handlePaymentSuccess(req, res, next) {
  try {
    const { txnid, status, hash, amount, email, firstname, productinfo, mihpayid } = { ...req.query, ...req.body };
    if (status !== 'success' || !sameHash(payuReverseHash({ status, email, firstname, productinfo, amount, txnid }), hash)) {
      return res.status(400).json({ success: false, error: 'Invalid PayU callback' });
    }

    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('payu_transaction_id', txnid).single();
    if (orderError) throw orderError;
    if (Number(order.amount).toFixed(2) !== Number(amount).toFixed(2)) return res.status(400).json({ success: false, error: 'Payment amount mismatch' });
    const { data: storeOwner, error: storeOwnerError } = await supabase.from('stores').select('seller_id').eq('id', order.seller_id).single();
    if (storeOwnerError) throw storeOwnerError;
    const storeOwnerId = storeOwner.seller_id;

    if (order.payment_status !== 'paid') {
      const { error } = await supabase.from('orders').update({
        payment_status: 'paid', status: 'confirmed', payu_mihpayid: mihpayid,
      }).eq('id', order.id);
      if (error) throw error;

      const { data: payout } = await supabase.from('payouts').select('id').eq('order_id', order.id).maybeSingle();
      if (!payout) await supabase.from('payouts').insert({
        seller_id: order.seller_id, order_id: order.id, gross_amount: order.amount,
        commission_amount: order.commission_amount, net_amount: order.seller_amount, status: 'pending',
      });
      await supabase.from('notifications').insert([
        { user_id: storeOwnerId, type: 'new_order', title: 'New order', body: `You have a new order worth ₹${order.seller_amount}`, is_read: false },
        { user_id: order.buyer_id, type: 'order_confirmed', title: 'Order confirmed', body: 'Your payment was successful. The seller will ship soon.', is_read: false },
      ]);
    }
    res.redirect(303, redirectToApp(`order-confirmation?orderId=${encodeURIComponent(order.id)}`));
  } catch (error) { next(error); }
}

async function handlePaymentFailure(req, res, next) {
  try {
    const { txnid } = { ...req.query, ...req.body };
    if (txnid) await supabase.from('orders').update({ payment_status: 'failed', status: 'cancelled' }).eq('payu_transaction_id', txnid).neq('payment_status', 'paid');
    res.redirect(303, redirectToApp('payment-failed'));
  } catch (error) { next(error); }
}

router.post('/success', handlePaymentSuccess);
router.get('/success', handlePaymentSuccess);
router.post('/failure', handlePaymentFailure);
router.get('/failure', handlePaymentFailure);

router.post('/refund', requireAuth, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error) throw error;
    const { data: store, error: storeError } = await supabase.from('stores').select('seller_id').eq('id', order.seller_id).single();
    if (storeError) throw storeError;
    if (req.user.id !== order.buyer_id && req.user.id !== store.seller_id) return res.status(403).json({ success: false, error: 'Not allowed' });
    if (order.payment_status !== 'paid' || !order.payu_mihpayid) return res.status(400).json({ success: false, error: 'Order is not refundable' });

    const hash = sha512(`${process.env.PAYU_MERCHANT_KEY}|cancel_refund_transaction|${order.payu_mihpayid}|${process.env.PAYU_SALT}`);
    const response = await fetch(`${process.env.PAYU_BASE_URL}/merchant/postservice`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ key: process.env.PAYU_MERCHANT_KEY, command: 'cancel_refund_transaction', var1: order.payu_mihpayid, var2: order.payu_transaction_id, var3: String(order.amount), hash }),
    });
    const result = await response.text();
    if (!response.ok) return res.status(502).json({ success: false, error: 'PayU refund request failed' });
    await supabase.from('orders').update({ refund_status: 'processing', status: 'cancelled' }).eq('id', orderId);
    res.json({ success: true, payuResponse: result });
  } catch (error) { next(error); }
});

module.exports = router;
