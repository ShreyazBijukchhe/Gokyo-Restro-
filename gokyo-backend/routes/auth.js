const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();
const ACCOUNT_TYPES = ['member', 'visitor', 'admin'];

function validateEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }
  const normalized = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return normalized === email && emailRegex.test(email);
}

function validatePhone(phone) {
  return typeof phone === 'string' && /^\d{7,15}$/.test(phone);
}

router.post('/register', async (req, res, next) => {
  let connection;
  try {
    const { full_name, email, phone, password, account_type } = req.body;

    if (typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const normalizedAccountType = ACCOUNT_TYPES.includes(account_type) ? account_type : 'visitor';

    connection = await pool.getConnection();
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await connection.query(
      'INSERT INTO users (full_name, email, phone, password_hash, account_type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [full_name.trim(), email.trim().toLowerCase(), phone.trim(), password_hash, normalizedAccountType]
    );

    const [users] = await connection.query('SELECT id, full_name, email, phone, account_type FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    const user = users[0];
    const token = jwt.sign({ id: user.id, email: user.email, account_type: user.account_type }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'User registered successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.post('/login', async (req, res, next) => {
  let connection;
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, full_name, email, phone, password_hash, account_type FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, account_type: user.account_type }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          account_type: user.account_type,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
