const ReviewModel = require('../models/ReviewModel');

class ReviewController {
    static async showReviewForm(req, res) {
        const { booking_id } = req.query;
        res.render('user/rate-experience', { title: 'Rate Your Experience', booking_id });
    }

    static async submitReview(req, res) {
        const { booking_id, food_quality, staff_behaviour, ambience, overall_rating, additional_feedback } = req.body;
        if (!req.session.user) return res.redirect('/login');
        
        await ReviewModel.create({
            booking_id,
            user_id: req.session.user.id,
            food_quality: parseInt(food_quality),
            staff_behaviour: parseInt(staff_behaviour),
            ambience: parseInt(ambience),
            overall_rating: parseInt(overall_rating),
            additional_feedback
        });
        
        res.redirect('/my-bookings');
    }
}

module.exports = ReviewController;