const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.type === 'Admin') {
        next();
    } else {
        res.redirect('/home');
    }
};

module.exports = { isAuthenticated, isAdmin };