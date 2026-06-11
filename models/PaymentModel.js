const { pool } = require('../config/database');

class PaymentModel {
    static async create(paymentData) {
        const { payment_number, booking_id, order_id, user_id, amount, payment_method, transaction_id } = paymentData;
        const [result] = await pool.query(
            `INSERT INTO payments (payment_number, booking_id, order_id, user_id, amount, payment_method, transaction_id, payment_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Success')`,
            [payment_number, booking_id, order_id, user_id, amount, payment_method, transaction_id]
        );
        if (booking_id) {
            await pool.query('UPDATE bookings SET status = "Confirmed" WHERE booking_id = ?', [booking_id]);
        }
        return result.insertId;
    }

    static async findById(paymentId) {
        const [rows] = await pool.query('SELECT * FROM payments WHERE payment_id = ?', [paymentId]);
        return rows[0];
    }

    static generatePaymentNumber() {
        return `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
}

module.exports = PaymentModel;