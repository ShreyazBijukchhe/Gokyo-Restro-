const OfferModel = require('../models/OfferModel');

class OfferController {
    static async showOffers(req, res) {
        try {
            const offers = await OfferModel.getActiveOffers();
            res.render('user/offers', { title: 'Offers & Schemes', offers });
        } catch (error) {
            res.render('user/offers', { title: 'Offers & Schemes', offers: [] });
        }
    }
}

module.exports = OfferController;