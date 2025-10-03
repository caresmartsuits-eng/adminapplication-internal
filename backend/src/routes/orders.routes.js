const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../auth');
const { logAudit } = require('../audits');

const router = express.Router();

router.get('/orders/next-snum', authenticateToken, (_req, res) => {
  db.get('SELECT MAX(CAST(SUBSTR(snum, 2) AS INTEGER)) as max_snum FROM orders', (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const maxNum = row && row.max_snum ? row.max_snum : 0;
    res.json({ snum: 'S' + (maxNum + 1) });
  });
});

router.post('/orders/create', authenticateToken, (req, res) => {
  const { snum, order_number, product_type, delivery_date, assigned_user } = req.body;
  const status = 'Order Received';
  if (!snum || !order_number || !product_type || !delivery_date || !assigned_user) {
    logAudit('Create order failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All order fields are required' });
  }
  db.get('SELECT snum FROM orders WHERE snum = ?', [snum], (err, row) => {
    if (err) {
      logAudit('Create order failed', req.user.username, { message: 'Database error during SNUM check', attempt: req.body });
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      logAudit('Create order failed', req.user.username, { message: 'Duplicate SNUM attempted', snum, attempt: req.body });
      return res.status(409).json({ error: 'An order with this SNUM already exists.' });
    }
    db.run(
      'INSERT INTO orders (snum, order_number, product_type, delivery_date, status, assigned_user) VALUES (?, ?, ?, ?, ?, ?)',
      [snum, order_number, product_type, delivery_date, status, assigned_user],
      function (err) {
        if (err) {
          logAudit('Create order failed', req.user.username, { message: 'Database error', attempt: req.body });
          return res.status(500).json({ error: 'Database error' });
        }
        logAudit('Order created', req.user.username, { orderId: this.lastID, orderDetails: req.body });
        res.status(201).json({ message: 'Order created successfully', orderId: this.lastID });
      }
    );
  });
});

router.get('/orders', authenticateToken, (req, res) => {
  const { snum, orderNumber } = req.query;
  let sql = 'SELECT * FROM orders';
  const params = [];
  if (snum && orderNumber) {
    sql += ' WHERE LOWER(snum) = LOWER(?) OR order_number = ?';
    params.push(snum, orderNumber);
  } else if (snum) {
    sql += ' WHERE LOWER(snum) = LOWER(?)';
    params.push(snum);
  } else if (orderNumber) {
    sql += ' WHERE order_number = ?';
    params.push(orderNumber);
  } else if (req.user.role !== 'admin') {
    sql += ' WHERE assigned_user = ?';
    params.push(req.user.username);
  }
  db.all(sql, params, (err, rows) => {
    if (err) {
      logAudit('View orders failed', req.user.username, { message: 'Database error' });
      return res.status(500).json({ error: 'Database error' });
    }
    logAudit('Viewed orders', req.user.username, { count: rows.length, query: req.query });
    res.json(rows);
  });
});

router.put('/orders/update/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    logAudit('Update order failed', req.user.username, { message: 'Status is required', orderId: id });
    return res.status(400).json({ error: 'Status is required' });
  }
  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function (err) {
    if (err) {
      logAudit('Update order failed', req.user.username, { message: 'Database error', orderId: id, newStatus: status });
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      logAudit('Update order failed', req.user.username, { message: 'Order not found', orderId: id, newStatus: status });
      return res.status(404).json({ error: 'Order not found' });
    }
    logAudit('Order updated', req.user.username, { orderId: id, newStatus: status });
    res.status(200).json({ message: 'Order updated successfully' });
  });
});

module.exports = router;