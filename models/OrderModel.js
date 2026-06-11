const { pool } = require('../config/database');

class OrderModel {
    static async create(orderData) {
        const { order_number, user_id, booking_id, order_type, delivery_address, special_instructions, subtotal, tax, total_amount } = orderData;
        const [result] = await pool.query(
            `INSERT INTO orders (order_number, user_id, booking_id, order_type, delivery_address, special_instructions, subtotal, tax, total_amount, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [order_number, user_id, booking_id, order_type, delivery_address, special_instructions, subtotal, tax, total_amount]
        );
        return result.insertId;
    }

    static async addOrderItems(orderId, items) {
        for (const item of items) {
            await pool.query(
                'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.item_id, item.quantity, item.price]
            );
        }
    }

    static async getUserOrders(userId) {
        const [rows] = await pool.query(
            `SELECT o.*, COUNT(oi.order_item_id) as item_count 
             FROM orders o 
             LEFT JOIN order_items oi ON o.order_id = oi.order_id 
             WHERE o.user_id = ? 
             GROUP BY o.order_id 
             ORDER BY o.created_at DESC`,
            [userId]
        );
        return rows;
    }

    static generateOrderNumber() {
        return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
}

module.exports = OrderModel;