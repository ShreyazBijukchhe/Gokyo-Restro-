const express = require('express');
const MenuController = require('../controllers/menuController');
const router = express.Router();

router.get('/', MenuController.showMenu);
router.get('/cart', MenuController.showCart);
router.post('/add-to-cart', MenuController.addToCart);
router.post('/update-cart', MenuController.updateCart);

module.exports = router;