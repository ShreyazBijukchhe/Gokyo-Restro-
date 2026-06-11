const express = require('express');
const BookingController = require('../controllers/bookingController');
const PaymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.get('/', BookingController.showBookingForm);
router.post('/create', isAuthenticated, BookingController.createBooking);
router.get('/my-bookings', isAuthenticated, BookingController.showMyBookings);
router.post('/cancel/:id', isAuthenticated, BookingController.cancelBooking);
router.get('/confirmation', PaymentController.showConfirmation);

module.exports = router;