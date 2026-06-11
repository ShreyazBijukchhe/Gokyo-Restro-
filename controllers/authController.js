const UserModel = require('../models/UserModel');

class AuthController {
    static showLogin(req, res) {
        res.render('auth/login', { title: 'Sign In', error: null });
    }

    static async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await UserModel.findByEmail(email);
            if (!user || !(await UserModel.verifyPassword(password, user.password))) {
                return res.render('auth/login', { title: 'Sign In', error: 'Invalid email or password' });
            }
            req.session.user = {
                id: user.user_id,
                name: user.full_name,
                email: user.email,
                type: user.user_type
            };
            res.redirect(user.user_type === 'Admin' ? '/admin/dashboard' : '/home');
        } catch (error) {
            res.render('auth/login', { title: 'Sign In', error: 'An error occurred' });
        }
    }

    static showRegister(req, res) {
        res.render('auth/register', { title: 'Create Account', error: null });
    }

    static async register(req, res) {
        const { full_name, email, phone, password, account_type } = req.body;
        try {
            if (await UserModel.findByEmail(email)) {
                return res.render('auth/register', { title: 'Create Account', error: 'Email already registered' });
            }
            const userId = await UserModel.create({ full_name, email, phone, password, user_type: account_type || 'Visitor' });
            req.session.user = { id: userId, name: full_name, email: email, type: account_type || 'Visitor' };
            res.redirect('/home');
        } catch (error) {
            res.render('auth/register', { title: 'Create Account', error: 'Registration failed' });
        }
    }

    static logout(req, res) {
        req.session.destroy();
        res.redirect('/login');
    }
}

module.exports = AuthController;