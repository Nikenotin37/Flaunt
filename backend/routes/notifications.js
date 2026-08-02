const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '', {
  auth: { autoRefreshToken: false, persistSession: false },
});

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    res.json({ success: true, notifications: data || [] });
  } catch (error) { next(error); }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('is_read', false);
    if (error) throw error;
    res.json({ success: true, count: count || 0 });
  } catch (error) { next(error); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json({ success: true, notification: data });
  } catch (error) { next(error); }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
