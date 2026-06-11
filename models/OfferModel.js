const { pool } = require('../config/database');

class OfferModel {
    static async getActiveOffers() {
        const [rows] = await pool.query(
            `SELECT * FROM offers 
             WHERE status = 'Live' AND valid_from <= CURDATE() AND valid_until >= CURDATE()`
        );
        return rows;
    }

    static async getAllOffers() {
        const [rows] = await pool.query('SELECT * FROM offers ORDER BY created_at DESC');
        return rows;
    }

    static async create(offerData) {
        const { offer_title, description, discount_percentage, valid_from, valid_until, applicable_to, status } = offerData;
        const [result] = await pool.query(
            `INSERT INTO offers (offer_title, description, discount_percentage, valid_from, valid_until, applicable_to, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [offer_title, description, discount_percentage, valid_from, valid_until, applicable_to, status]
        );
        return result.insertId;
    }
}

module.exports = OfferModel;