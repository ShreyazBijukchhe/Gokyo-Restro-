const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const PAYMENT_METHODS = ['eSewa', 'Khalti', 'Card', 'Cash'];
const STATUS_VALUES = ['Pending', 'Confirmed', 'Cancelled'];

function isValidDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isFutureOrToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

router.post('/', authenticateToken, async (req, res, next) => {
  let connection;
  try {
    const { table_id, booking_date, booking_time, num_guests, advance_amount, payment_method } = req.body;

    if (typeof table_id !== 'number' || table_id <= 0) {
      return res.status(400).json({ error: 'Valid table_id is required' });
    }
    if (!isValidDateString(booking_date) || !isFutureOrToday(booking_date)) {
      return res.status(400).json({ error: 'Booking date must be today or a future date in YYYY-MM-DD format' });
    }
    if (typeof booking_time !== 'string' || booking_time.trim().length === 0) {
      return res.status(400).json({ error: 'Booking time is required' });
    }
    if (typeof num_guests !== 'number' || num_guests < 1 || num_guests > 20) {
      return res.status(400).json({ error: 'Number of guests must be between 1 and 20' });
    }
    if (typeof advance_amount !== 'number' || advance_amount < 0) {
      return res.status(400).json({ error: 'Advance amount must be a non-negative number' });
    }
    if (!PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ error: 'Payment method is invalid' });
    }

    connection = await pool.getConnection();
    const [tableRows] = await connection.query('SELECT id, status FROM restaurant_tables WHERE id = ?', [table_id]);
    const table = tableRows[0];
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const booking_id = `GBR-${Date.now()}`;
    const [insertResult] = await connection.query(
      `INSERT INTO bookings (
        booking_id, user_id, table_id, booking_date, booking_time, num_guests, advance_amount, payment_method, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [booking_id, req.user.id, table_id, booking_date, booking_time.trim(), num_guests, advance_amount, payment_method, 'Confirmed']
    );

    const [rows] = await connection.query(
      'SELECT id, booking_id, table_id, booking_date, booking_time, num_guests, advance_amount, payment_method, status FROM bookings WHERE id = ?',
      [insertResult.insertId]
    );

    res.status(201).json({ message: 'Booking created successfully', data: rows[0] });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/my-bookings', authenticateToken, async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT b.*, t.table_number, t.capacity, t.location
        FROM bookings b
        LEFT JOIN restaurant_tables t ON b.table_id = t.id
        WHERE b.user_id = ?
        ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.user.id]
    );
    res.json({ message: 'Bookings retrieved', data: rows });
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
    const [bookingRows] = await connection.query('SELECT * FROM bookings WHERE id = ?', [Number(req.params.id)]);
    const booking = bookingRows[0];
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id && req.user.account_type !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json({ message: 'Booking retrieved', data: booking });
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
    const [bookingRows] = await connection.query('SELECT * FROM bookings WHERE id = ?', [Number(req.params.id)]);
    const booking = bookingRows[0];
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    const [updateResult] = await connection.query('UPDATE bookings SET status = ? WHERE id = ?', ['Cancelled', booking.id]);
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
