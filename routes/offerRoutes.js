const express = require('express');
const router = express.Router();

// Simple controller for offers
const offerController = {
    showOffers: async (req, res) => {
        try {
            const { pool } = require('../config/database');
            const [offers] = await pool.query(
                "SELECT * FROM offers WHERE status = 'Live' AND valid_from <= CURDATE() AND valid_until >= CURDATE()"
            );
            res.render('user/offers', { title: 'Offers & Schemes', offers });
        } catch (error) {
            res.render('user/offers', { title: 'Offers & Schemes', offers: [] });
        }
    }
};

router.get('/', offerController.showOffers);

module.exports = router;