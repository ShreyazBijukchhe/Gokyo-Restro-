const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/stats', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [[usersResult], [bookingsResult], [ordersResult], [menuResult]] = await Promise.all([
      connection.query('SELECT COUNT(*) AS count FROM users'),
      connection.query('SELECT COUNT(*) AS count FROM bookings'),
      connection.query('SELECT COUNT(*) AS count FROM orders'),
      connection.query('SELECT COUNT(*) AS count FROM menu_items'),
    ]);

    res.json({
      message: 'Admin stats retrieved',
      data: {
        total_users: Number(usersResult[0].count),
        total_bookings: Number(bookingsResult[0].count),
        total_orders: Number(ordersResult[0].count),
        total_menu_items: Number(menuResult[0].count),
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/revenue', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [revenueRows] = await connection.query(
      `SELECT
        COALESCE(SUM(total), 0) AS total_revenue,
        COALESCE(SUM(subtotal), 0) AS subtotal_revenue,
        COALESCE(SUM(tax), 0) AS total_tax,
        SUM(status = 'Completed') AS completed_orders,
        SUM(status = 'Pending') AS pending_orders
      FROM orders`
    );

    const [bookingRevenueRows] = await connection.query('SELECT COALESCE(SUM(advance_amount), 0) AS advance_revenue FROM bookings');

    res.json({
      message: 'Admin revenue retrieved',
      data: {
        total_revenue: Number(revenueRows[0].total_revenue),
        subtotal_revenue: Number(revenueRows[0].subtotal_revenue),
        total_tax: Number(revenueRows[0].total_tax),
        completed_orders: Number(revenueRows[0].completed_orders),
        pending_orders: Number(revenueRows[0].pending_orders),
        advance_revenue: Number(bookingRevenueRows[0].advance_revenue),
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/bookings/all', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT b.*, u.full_name AS customer_name, u.email AS customer_email, t.table_number, t.location
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN restaurant_tables t ON b.table_id = t.id
        ORDER BY b.booking_date DESC, b.booking_time DESC`
    );
    res.json({ message: 'All bookings retrieved', data: rows });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
