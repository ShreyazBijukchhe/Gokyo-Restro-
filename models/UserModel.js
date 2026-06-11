const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
    static async create(userData) {
        const { full_name, email, phone, password, user_type = 'Visitor' } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, phone, password, user_type) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, phone, hashedPassword, user_type]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(userId) {
        const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        return rows[0];
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = UserModel;