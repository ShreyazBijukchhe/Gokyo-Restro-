const PaymentModel = require('../models/PaymentModel');

class PaymentController {
    static async showPayment(req, res) {
        const { booking_id, amount } = req.query;
        res.render('user/payment', { title: 'Payment', booking_id, amount });
    }

    static async processPayment(req, res) {
        const { booking_id, amount, payment_method } = req.body;
        if (!req.session.user) return res.redirect('/login');
        
        const paymentNumber = PaymentModel.generatePaymentNumber();
        await PaymentModel.create({
            payment_number: paymentNumber,
            booking_id: booking_id,
            user_id: req.session.user.id,
            amount: amount,
            payment_method: payment_method,
            transaction_id: `TXN${Date.now()}`
        });
        
        res.redirect(`/booking/confirmation?id=${booking_id}`);
    }

    static async showConfirmation(req, res) {
        const { id } = req.query;
        const { pool } = require('../config/database');
        const [rows] = await pool.query(
            `SELECT b.*, t.table_number, t.location FROM bookings b 
             JOIN restaurant_tables t ON b.table_id = t.table_id 
             WHERE b.booking_id = ?`,
            [id]
        );
        res.render('user/booking-confirmation', { title: 'Booking Confirmed', booking: rows[0] });
    }
}

module.exports = PaymentController;