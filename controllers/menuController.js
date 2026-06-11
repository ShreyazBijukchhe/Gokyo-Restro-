
const MenuItemModel = require('../models/MenuItemModel');

class MenuController {
    static async showMenu(req, res) {
        const category = req.query.category || 'All';
        const items = await MenuItemModel.getAll(category);
        res.render('user/order-food', { title: 'Order Food', items, selectedCategory: category });
    }

    static async showCart(req, res) {
        const cart = req.session.cart || [];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.13;
        const total = subtotal + tax;
        res.render('user/cart', { title: 'My Cart', cart, subtotal, tax, total });
    }

    static addToCart(req, res) {
        const { item_id, name, price } = req.body;
        if (!req.session.cart) req.session.cart = [];
        const existingItem = req.session.cart.find(item => item.item_id == item_id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            req.session.cart.push({ item_id, name, price, quantity: 1 });
        }
        res.redirect('/menu');
    }

    static updateCart(req, res) {
        const { item_id, quantity } = req.body;
        const item = req.session.cart.find(item => item.item_id == item_id);
        if (item) {
            if (quantity <= 0) {
                req.session.cart = req.session.cart.filter(item => item.item_id != item_id);
            } else {
                item.quantity = quantity;
            }
        }
        res.redirect('/cart');
    }
}

module.exports = MenuController;