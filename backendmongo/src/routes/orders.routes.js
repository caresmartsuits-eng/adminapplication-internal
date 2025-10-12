// ... existing code ...
const express = require('express');
const { authenticateToken } = require('../auth');
const { logAudit } = require('../audits');
const Order = require('../models/Order').default;
// ... existing code ...

const orderRoutes = express.Router();


/*
// --- NEW CORS PREFLIGHT HANDLER ---
// This handles the browser's automatic OPTIONS requests before a cross-origin request.
orderRoutes.options(/.*!/, (req, res) => {
    // Ideally, replace '*' with your specific frontend domain (e.g., 'http://localhost:5173')
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204); // Respond with 204 No Content to signal success
});
// ----------------------------------
*/


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
  const { snum, order_number, product_type, delivery_date, assigned_user,quantity,person } = req.body;
  const status = 'Order Received';
  const parsedQuantity = parseInt(quantity, 10);

  if (!snum || !order_number || !product_type || !delivery_date || !assigned_user || !quantity || !person) {
    logAudit('Create order failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All order fields are required' });
  }
  try {
  // 2. Quantity Check
  if (isNaN(parsedQuantity)  || quantity <= 0) {
      logAudit('Create order failed', req.user.username, { message: 'Invalid quantity', attempt: req.body });
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
  }
    const exists = await Order.findOne({ snum }).lean();
    if (exists) {
      logAudit('Create order failed', req.user.username, { message: 'Duplicate SNUM attempted', snum, attempt: req.body });
      return res.status(409).json({ error: 'An order with this SNUM already exists.' });
    }

      // 3. DELIVERY DATE VALIDATION (Server-side)
      // Normalize today's date to YYYY-MM-DD format for string comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];

      // The delivery_date must be today or later
      if (delivery_date < todayString) {
          logAudit('Create order failed', req.user.username, { message: 'Delivery date cannot be in the past.', attempt: req.body });
          return res.status(400).json({ error: 'Delivery date cannot be in the past.' });
      }
    const doc = await Order.create({ snum, order_number, product_type, delivery_date, assigned_user , quantity,person,status  });
    logAudit('Order created', req.user.username, { orderId: doc._id.toString(), orderDetails: req.body });
    res.status(201).json({ message: 'Order created successfully', orderId: doc._id.toString() });
  } catch (_e) {
    logAudit('Create order failed', req.user.username, { message: 'Database error', attempt: req.body });
    res.status(500).json({ error: 'Database error' });
  }
});



// --- NEW ROUTE FOR DELIVERY STATUS ---
orderRoutes.get('/orders/delivery-status', authenticateToken, async (req, res) => {
    try {

        const today = new Date();
        // Format date to 'YYYY-MM-DD' string for comparison, assuming delivery_date is stored as a string
        const todayString = today.toISOString().split('T')[0];

        // The filter finds orders that meet one of two conditions:
        const filter = {
            $or: [
                // 1. Current Day Deliveries (Orders with status 'Delivered' and delivery date is today)
                {
                    delivery_date: todayString,
                },
                // 2. Past Pending Orders (Orders with delivery date before today and status is not 'Delivered')
                {
                    status: { $ne: 'Delivered' },
                    delivery_date: { $lt: todayString }, // Dates before today's date string
                },
            ],
        };

        // For non-admin users, filter by their assigned user
        if (req.user.role !== 'admin') {
            filter.assigned_user = req.user.username;
        }

        const rows = await Order.find(filter).lean();
        logAudit('Viewed delivery status orders', req.user.username, { count: rows.length, query: 'delivery-status' });

        res.json(
            rows.map((r) => ({
                ...r,
                id: r._id.toString(),
                _id: undefined,
            }))
        );

    } catch (_e) {
        logAudit('View delivery status orders failed', req.user.username, { message: 'Database error' });
        res.status(500).json({ error: 'Database error' });
    }
});

orderRoutes.get('/orders', authenticateToken, async (req, res) => {
  try {
      const { snum, orderNumber, deliveryDate, customerType, status, assignedUser } = req.query;
      const filter = {};

      // Apply filters from query parameters
      if (snum) filter.snum = snum;
      if (orderNumber) filter.order_number = orderNumber;
      if (deliveryDate) filter.delivery_date = deliveryDate; // Date filter (YYYY-MM-DD match)
      if (customerType) filter.person = customerType; // Customer Type filter
      if (status) filter.status = status; // Status filter

      // Assigned User Filter (Used by admin and enforced for non-admin)
      if (assignedUser) filter.assigned_user = assignedUser;

      // Enforce security: Non-admin users can only view their own assigned orders
      if (req.user.role !== 'admin') {
          // This overwrites any assignedUser filter if the non-admin tries to filter another user's orders
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


// --- NEW ROUTE FOR KPI COUNTS ---
orderRoutes.get('/orders/kpi-counts', authenticateToken, async (req, res) => {
    try {
        const today = new Date();
        // Normalize date to YYYY-MM-DD string for comparison
        const todayString = today.toISOString().split('T')[0];

        // Base filter for security: non-admin users only see their orders
        const baseFilter = {};
        if (req.user.role !== 'admin') {
            baseFilter.assigned_user = req.user.username;
        }

        // 1. Overdue Deliveries Count: delivery_date < today AND status != 'Delivered'
        const overdueFilter = {
            ...baseFilter,
            status: { $ne: 'Delivered' },
            delivery_date: { $lt: todayString },
        };
        const overdueDeliveriesCount = await Order.countDocuments(overdueFilter);

        // 2. Today's Deliveries Count: delivery_date == today
        const todayDeliveriesFilter = {
            ...baseFilter,
            delivery_date: todayString,
        };
        const todayDeliveriesCount = await Order.countDocuments(todayDeliveriesFilter);

        // 3. New Orders (We'll count orders with initial status 'Order Received' for KPI)
        const newOrdersFilter = {
            ...baseFilter,
            status: 'Order Received',
        };
        const newOrdersCount = await Order.countDocuments(newOrdersFilter);


        logAudit('Fetched order KPI Order counts', req.user.username, {
            overdueDeliveries: overdueDeliveriesCount,
            deliveriesToday: todayDeliveriesCount,
            newOrders: newOrdersCount,
        });

        res.json({
            overdueDeliveries: overdueDeliveriesCount,
            deliveriesToday: todayDeliveriesCount,
            newOrders: newOrdersCount,
        });

    } catch (e) {
        logAudit('Fetch order KPI counts failed', req.user.username, { message: 'Database error' });
        res.status(500).json({ error: 'Database error' });
    }
});


// --- NEW ROUTE FOR ORDER STATUS BREAKDOWN ---
orderRoutes.get('/orders/status-breakdown', authenticateToken, async (req, res) => {
    try {
        const baseFilter = {};
        // Apply security filter for non-admin users
        if (req.user.role !== 'admin') {
            baseFilter.assigned_user = req.user.username;
        }

        // MongoDB Aggregation Pipeline
        const breakdown = await Order.aggregate([
            { $match: baseFilter }, // 1. Filter orders based on user role
            {
                $group: {
                    _id: '$status', // 2. Group by the 'status' field
                    count: { $sum: 1 } // 3. Count documents in each group
                }
            },
            {
                $project: { // 4. Rename _id to status and include count
                    status: '$_id',
                    count: '$count',
                    _id: 0
                }
            }
        ]);


        logAudit('Fetched order status breakdown', req.user.username, { count: breakdown.length });

        // Result will be an array like: [{ status: 'Delivered', count: 10 }, { status: 'In Transit', count: 5 }]
        res.json(breakdown);

    } catch (e) {
        logAudit('Fetch order status breakdown failed', req.user.username, { message: 'Database error' });
        res.status(500).json({ error: 'Database error' });
    }
});


module.exports = orderRoutes;
// ... existing code ...
