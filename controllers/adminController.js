const MenuItemModel = require('../models/MenuItemModel');
const ReportModel = require('../models/ReportModel');
const OfferModel = require('../models/OfferModel');
const { pool } = require('../config/database');

class AdminController {
    static async showDashboard(req, res) {
        const [bookingsCount] = await pool.query("SELECT COUNT(*) as count FROM bookings WHERE booking_date = CURDATE()");
        const [revenue] = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(payment_date) = CURDATE()");
        const [occupied] = await pool.query("SELECT COUNT(*) as count FROM restaurant_tables WHERE status = 'Reserved'");
        const [pendingOrders] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'");
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            bookingsToday: bookingsCount[0].count,
            revenueToday: revenue[0].total,
            tablesOccupied: occupied[0].count,
            ordersPending: pendingOrders[0].count
        });
    }

    static async showManageMenu(req, res) {
        const items = await MenuItemModel.getAll();
        res.render('admin/manage-menu', { title: 'Manage Menu', items });
    }

    static async addMenuItem(req, res) {
        const { item_name, category, price, description } = req.body;
        await MenuItemModel.create({ item_name, category, price, description });
        res.redirect('/admin/manage-menu');
    }

    static async deleteMenuItem(req, res) {
        const { id } = req.params;
        await MenuItemModel.delete(id);
        res.redirect('/admin/manage-menu');
    }

    static async showFinancialReport(req, res) {
        const report = await ReportModel.generateReport('January 2026');
        res.render('admin/financial-report', { title: 'Financial Report', report });
    }

    static async showPostOffer(req, res) {
        const offers = await OfferModel.getAllOffers();
        res.render('admin/post-offer', { title: 'Post Offer', offers });
    }

    static async createOffer(req, res) {
        const { offer_title, description, discount_percentage, valid_from, valid_until, applicable_to } = req.body;
        await OfferModel.create({
            offer_title, description, discount_percentage, valid_from, valid_until, applicable_to, status: 'Live'
        });
        res.redirect('/admin/post-offer');
    }
}

module.exports = AdminController;