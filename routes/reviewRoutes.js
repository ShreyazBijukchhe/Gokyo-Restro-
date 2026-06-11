const express = require('express');
const ReviewController = require('../controllers/reviewController');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.get('/', ReviewController.showReviewForm);
router.post('/submit', isAuthenticated, ReviewController.submitReview);

module.exports = router;