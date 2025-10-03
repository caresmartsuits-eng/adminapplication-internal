// ... existing code ...
const express = require('express');
const { authenticateToken } = require('../auth');
const { logAudit } = require('../audits');
const Order = require('../models/Order').default;
// ... existing code ...

const orderRoutes = express.Router();

orderRoutes.get('/orders/next-snum', authenticateToken, async (_req, res) => {
  try {
    // Find max snum like 'S<number>'
    const row = await Order.find({})
      .select('snum')
      .lean();

    const maxNum = row.reduce((max, r) => {
      const n = parseInt((r.snum || '').replace(/^S/i, ''), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);

    res.json({ snum: 'S' + (maxNum + 1) });
  } catch (_e) {
    res.status(500).json({ error: 'Database error' });
  }
});

orderRoutes.post('/orders/create', authenticateToken, async (req, res) => {
  const { snum, order_number, product_type, delivery_date, assigned_user } = req.body;
  const status = 'Order Received';
  if (!snum || !order_number || !product_type || !delivery_date || !assigned_user) {
    logAudit('Create order failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All order fields are required' });
  }
  try {
    const exists = await Order.findOne({ snum }).lean();
    if (exists) {
      logAudit('Create order failed', req.user.username, { message: 'Duplicate SNUM attempted', snum, attempt: req.body });
      return res.status(409).json({ error: 'An order with this SNUM already exists.' });
    }
    const doc = await Order.create({ snum, order_number, product_type, delivery_date, status, assigned_user });
    logAudit('Order created', req.user.username, { orderId: doc._id.toString(), orderDetails: req.body });
    res.status(201).json({ message: 'Order created successfully', orderId: doc._id.toString() });
  } catch (_e) {
    logAudit('Create order failed', req.user.username, { message: 'Database error', attempt: req.body });
    res.status(500).json({ error: 'Database error' });
  }
});

orderRoutes.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { snum, orderNumber } = req.query;
    const filter = {};
    if (snum && orderNumber) {
      filter.$or = [{ snum: new RegExp(`^${snum}$`, 'i') }, { order_number: Number(orderNumber) }];
    } else if (snum) {
      filter.snum = new RegExp(`^${snum}$`, 'i');
    } else if (orderNumber) {
      filter.order_number = Number(orderNumber);
    } else if (req.user.role !== 'admin') {
      filter.assigned_user = req.user.username;
    }
    const rows = await Order.find(filter).lean();
    logAudit('Viewed orders', req.user.username, { count: rows.length, query: req.query });
    res.json(
      rows.map((r) => ({
        ...r,
        id: r._id.toString(),
        _id: undefined,
      }))
    );
  } catch (_e) {
    logAudit('View orders failed', req.user.username, { message: 'Database error' });
    res.status(500).json({ error: 'Database error' });
  }
});

orderRoutes.put('/orders/update/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    logAudit('Update order failed', req.user.username, { message: 'Status is required', orderId: id });
    return res.status(400).json({ error: 'Status is required' });
  }
  try {
    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      logAudit('Update order failed', req.user.username, { message: 'Order not found', orderId: id, newStatus: status });
      return res.status(404).json({ error: 'Order not found' });
    }
    logAudit('Order updated', req.user.username, { orderId: id, newStatus: status });
    res.status(200).json({ message: 'Order updated successfully' });
  } catch (_e) {
    logAudit('Update order failed', req.user.username, { message: 'Database error', orderId: id, newStatus: status });
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = orderRoutes;
// ... existing code ...
