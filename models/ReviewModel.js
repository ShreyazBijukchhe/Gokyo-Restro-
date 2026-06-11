const { pool } = require('../config/database');

class ReviewModel {
    static async create(reviewData) {
        const { booking_id, user_id, food_quality, staff_behaviour, ambience, overall_rating, additional_feedback } = reviewData;
        const [result] = await pool.query(
            `INSERT INTO reviews (booking_id, user_id, food_quality, staff_behaviour, ambience, overall_rating, additional_feedback) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [booking_id, user_id, food_quality, staff_behaviour, ambience, overall_rating, additional_feedback]
        );
        await pool.query('UPDATE bookings SET status = "Completed" WHERE booking_id = ?', [booking_id]);
        return result.insertId;
    }
}

module.exports = ReviewModel;