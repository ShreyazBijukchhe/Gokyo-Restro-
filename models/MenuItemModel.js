const { pool } = require('../config/database');

class MenuItemModel {
    static async getAll(category = null) {
        let query = 'SELECT * FROM menu_items WHERE is_available = TRUE';
        const params = [];
        if (category && category !== 'All') {
            query += ' AND category = ?';
            params.push(category);
        }
        query += ' ORDER BY category, item_name';
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async findById(itemId) {
        const [rows] = await pool.query('SELECT * FROM menu_items WHERE item_id = ?', [itemId]);
        return rows[0];
    }

    static async create(itemData) {
        const { item_name, category, price, description } = itemData;
        const [result] = await pool.query(
            'INSERT INTO menu_items (item_name, category, price, description) VALUES (?, ?, ?, ?)',
            [item_name, category, price, description]
        );
        return result.insertId;
    }

    static async update(itemId, itemData) {
        const { item_name, category, price, description, is_available } = itemData;
        const [result] = await pool.query(
            'UPDATE menu_items SET item_name = ?, category = ?, price = ?, description = ?, is_available = ? WHERE item_id = ?',
            [item_name, category, price, description, is_available, itemId]
        );
        return result.affectedRows;
    }

    static async delete(itemId) {
        const [result] = await pool.query('DELETE FROM menu_items WHERE item_id = ?', [itemId]);
        return result.affectedRows;
    }
}

module.exports = MenuItemModel;