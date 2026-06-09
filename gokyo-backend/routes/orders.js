const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();
const ORDER_TYPES = ['dine-in', 'delivery'];
const ORDER_STATUS = ['Pending', 'Preparing', 'Completed', 'Cancelled'];

function validateOrderItems(items) {
  return Array.isArray(items) && items.length > 0 && items.every(item => {
    return item && typeof item.menu_item_id === 'number' && item.menu_item_id > 0 && typeof item.quantity === 'number' && item.quantity > 0;
  });
}

router.post('/', authenticateToken, async (req, res, next) => {
  let connection;
  try {
    const { order_type, booking_id, items } = req.body;

    if (!ORDER_TYPES.includes(order_type)) {
      return res.status(400).json({ error: 'Order type is invalid' });
    }
    if (!validateOrderItems(items)) {
      return res.status(400).json({ error: 'Order items must be a non-empty array of valid menu items' });
    }

    connection = await pool.getConnection();

    if (booking_id !== undefined && booking_id !== null) {
      const [bookingCheckRows] = await connection.query('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [Number(booking_id), req.user.id]);
      if (bookingCheckRows.length === 0) {
        return res.status(400).json({ error: 'Booking not found or does not belong to the user' });
      }
    }

    const menuIds = items.map(item => item.menu_item_id);
    const [menuResult] = await connection.query('SELECT id, price, name, status FROM menu_items WHERE id IN (?)', [menuIds]);
    if (menuResult.length !== items.length) {
      return res.status(400).json({ error: 'One or more menu items are invalid' });
    }

    const activeMenu = menuResult;
    const itemMap = new Map(activeMenu.map(menuItem => [menuItem.id, menuItem]));
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const menuItem = itemMap.get(item.menu_item_id);
      if (!menuItem || menuItem.status !== 'active') {
        return res.status(400).json({ error: `Menu item ${item.menu_item_id} is unavailable` });
      }
      const quantity = item.quantity;
      const price = Number(menuItem.price);
      orderItems.push({ menu_item_id: menuItem.id, quantity, price });
      subtotal += price * quantity;
    }

    const tax = Math.round(subtotal * 0.13);
    const total = subtotal + tax;
    const order_id = `GOD-${Date.now()}`;

    await connection.beginTransaction();
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_id, user_id, booking_id, order_type, status, subtotal, tax, total, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [order_id, req.user.id, booking_id || null, order_type, 'Pending', subtotal, tax, total]
    );

    const [createdOrderRows] = await connection.query('SELECT id, order_id, booking_id, order_type, status, subtotal, tax, total FROM orders WHERE id = ?', [orderResult.insertId]);
    const createdOrder = createdOrderRows[0];

    for (const item of orderItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [createdOrder.id, item.menu_item_id, item.quantity, item.price]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Order created successfully', data: createdOrder });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/my-orders', authenticateToken, async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ message: 'Orders retrieved', data: rows });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ?', [Number(req.params.id)]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.user_id !== req.user.id && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [itemsRows] = await connection.query(
      `SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price, mi.name
         FROM order_items oi
         LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?`,
      [order.id]
    );

    res.json({ message: 'Order retrieved', data: { ...order, items: itemsRows } });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:id/status', authenticateToken, authorizeAdmin, async (req, res, next) => {
  let connection;
  try {
    const { status } = req.body;
    if (!ORDER_STATUS.includes(status)) {
      return res.status(400).json({ error: 'Status is invalid' });
    }

    connection = await pool.getConnection();
    const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ?', [Number(req.params.id)]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
    res.json({ message: 'Order status updated' });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:id/cancel', authenticateToken, async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ?', [Number(req.params.id)]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['Cancelled', order.id]);
    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
