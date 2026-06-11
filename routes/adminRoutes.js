const express = require('express');
const AdminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', isAdmin, AdminController.showDashboard);
router.get('/manage-menu', isAdmin, AdminController.showManageMenu);
router.post('/add-menu-item', isAdmin, AdminController.addMenuItem);
router.post('/delete-menu-item/:id', isAdmin, AdminController.deleteMenuItem);
router.get('/financial-report', isAdmin, AdminController.showFinancialReport);
router.get('/post-offer', isAdmin, AdminController.showPostOffer);
router.post('/create-offer', isAdmin, AdminController.createOffer);

module.exports = router;