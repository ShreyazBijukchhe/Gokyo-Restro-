const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();
const VALID_CATEGORIES = ['starters', 'mains', 'drinks', 'premium'];
const VALID_STATUS = ['active', 'inactive'];

router.get('/', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM menu_items WHERE status = ? ORDER BY category, name', ['active']);
    res.json({ message: 'Menu retrieved', data: rows });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/category/:category', async (req, res, next) => {
  let connection;
  try {
    const category = req.params.category.toLowerCase();
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM menu_items WHERE category = ? AND status = ? ORDER BY name', [category, 'active']);
    res.json({ message: 'Category menu retrieved', data: rows });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.post('/', authenticateToken, authorizeAdmin, async (req, res, next) => {
  let connection;
  try {
    const { name, description, category, price, status } = req.body;

    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({ error: 'Description is required' });
    }
    const normalizedCategory = typeof category === 'string' ? category.toLowerCase() : '';
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    const normalizedStatus = VALID_STATUS.includes(status) ? status : 'active';

    connection = await pool.getConnection();
    const [insertResult] = await connection.query(
      `INSERT INTO menu_items (name, description, category, price, status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name.trim(), description.trim(), normalizedCategory, price, normalizedStatus]
    );

    const [rows] = await connection.query('SELECT * FROM menu_items WHERE id = ?', [insertResult.insertId]);
    res.status(201).json({ message: 'Menu item created', data: rows[0] });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:id', authenticateToken, authorizeAdmin, async (req, res, next) => {
  let connection;
  try {
    const menuId = Number(req.params.id);
    const { name, description, category, price, status } = req.body;

    connection = await pool.getConnection();
    const [menuResult] = await connection.query('SELECT * FROM menu_items WHERE id = ?', [menuId]);
    const menuItem = menuResult[0];
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const updatedName = typeof name === 'string' && name.trim().length > 1 ? name.trim() : menuItem.name;
    const updatedDescription = typeof description === 'string' && description.trim().length > 4 ? description.trim() : menuItem.description;
    const normalizedCategory = typeof category === 'string' && VALID_CATEGORIES.includes(category.toLowerCase()) ? category.toLowerCase() : menuItem.category;
    const updatedPrice = typeof price === 'number' && price > 0 ? price : menuItem.price;
    const normalizedStatus = VALID_STATUS.includes(status) ? status : menuItem.status;

    await connection.query(
      'UPDATE menu_items SET name = ?, description = ?, category = ?, price = ?, status = ? WHERE id = ?',
      [updatedName, updatedDescription, normalizedCategory, updatedPrice, normalizedStatus, menuId]
    );

    const [rows] = await connection.query('SELECT * FROM menu_items WHERE id = ?', [menuId]);
    res.json({ message: 'Menu item updated', data: rows[0] });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res, next) => {
  let connection;
  try {
    const menuId = Number(req.params.id);
    connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM menu_items WHERE id = ?', [menuId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
