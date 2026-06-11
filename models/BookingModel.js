const { pool } = require('../config/database');

class BookingModel {
    static async getAvailableTables(date, time, guests) {
        const [rows] = await pool.query(
            `SELECT * FROM restaurant_tables 
             WHERE capacity >= ? AND table_id NOT IN (
                 SELECT table_id FROM bookings 
                 WHERE booking_date = ? AND booking_time = ? 
                 AND status NOT IN ('Cancelled', 'Completed')
             )`,
            [guests, date, time]
        );
        return rows;
    }

    static async create(bookingData) {
        const { booking_number, user_id, table_id, booking_date, booking_time, number_of_guests, advance_payment } = bookingData;
        const [result] = await pool.query(
            `INSERT INTO bookings (booking_number, user_id, table_id, booking_date, booking_time, number_of_guests, advance_payment, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Confirmed')`,
            [booking_number, user_id, table_id, booking_date, booking_time, number_of_guests, advance_payment]
        );
        await pool.query('UPDATE restaurant_tables SET status = "Reserved" WHERE table_id = ?', [table_id]);
        return result.insertId;
    }

    static async getUserBookings(userId) {
        const [rows] = await pool.query(
            `SELECT b.*, t.table_number, t.location, t.capacity 
             FROM bookings b 
             JOIN restaurant_tables t ON b.table_id = t.table_id 
             WHERE b.user_id = ? 
             ORDER BY b.booking_date DESC`,
            [userId]
        );
        return rows;
    }

    static async findById(bookingId) {
        const [rows] = await pool.query(
            `SELECT b.*, t.table_number, t.location, t.capacity, u.full_name 
             FROM bookings b 
             JOIN restaurant_tables t ON b.table_id = t.table_id 
             JOIN users u ON b.user_id = u.user_id 
             WHERE b.booking_id = ?`,
            [bookingId]
        );
        return rows[0];
    }

    static async cancel(bookingId) {
        const [result] = await pool.query('UPDATE bookings SET status = "Cancelled" WHERE booking_id = ?', [bookingId]);
        return result.affectedRows;
    }

    static generateBookingNumber() {
        return `GBR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
}

module.exports = BookingModel;