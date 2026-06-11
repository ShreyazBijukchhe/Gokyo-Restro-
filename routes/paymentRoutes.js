const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.get('/', PaymentController.showPayment);
router.post('/process', isAuthenticated, PaymentController.processPayment);

module.exports = router;