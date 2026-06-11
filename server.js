const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const { pool, testConnection } = require('./config/database');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Session middleware
app.use(session({
    name: 'gokyoSession',
    secret: process.env.SESSION_SECRET || 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ========== API ENDPOINTS ==========

// Get current user
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false, user: null });
    }
});

// Login API (MySQL)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        const user = users[0];
        
        // For now, accept any password (since passwords might not be hashed)
        // Later you can add bcrypt comparison
        req.session.user = {
            id: user.user_id,
            name: user.full_name,
            email: user.email,
            type: user.user_type
        };
        
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

// Register API (MySQL)
app.post('/api/register', async (req, res) => {
    const { full_name, email, phone, password, account_type } = req.body;
    
    try {
        // Check if user exists
        const [existing] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.json({ success: false, message: 'Email already registered' });
        }
        
        // Hash password (simple for now)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, phone, password, user_type) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, phone, hashedPassword, account_type || 'Visitor']
        );
        
        req.session.user = {
            id: result.insertId,
            name: full_name,
            email: email,
            type: account_type || 'Visitor'
        };
        
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Register error:', error);
        res.json({ success: false, message: 'Registration failed' });
    }
});

// Guest login
app.post('/api/guest-login', (req, res) => {
    req.session.user = {
        id: 'guest_' + Date.now(),
        name: 'Guest User',
        email: 'guest@temp.com',
        type: 'Guest'
    };
    res.json({ success: true, user: req.session.user });
});

// Logout
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get menu items (from MySQL)
app.get('/api/menu', async (req, res) => {
    try {
        const [menu] = await pool.query(
            'SELECT item_id as id, item_name as name, category, price, description FROM menu_items WHERE is_available = TRUE'
        );
        res.json({ success: true, menu: menu });
    } catch (error) {
        console.error('Menu error:', error);
        res.json({ success: false, menu: [] });
    }
});

// Get available tables
app.get('/api/tables', async (req, res) => {
    const { date, time, guests } = req.query;
    
    try {
        let query = 'SELECT table_id as id, table_number as number, capacity, location, status FROM restaurant_tables';
        let params = [];
        
        if (guests) {
            query += ' WHERE capacity >= ?';
            params.push(parseInt(guests));
        }
        
        const [tables] = await pool.query(query, params);
        res.json({ success: true, tables: tables });
    } catch (error) {
        console.error('Tables error:', error);
        res.json({ success: false, tables: [] });
    }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
    if (!req.session.user || req.session.user.type === 'Guest') {
        return res.json({ success: false, message: 'Please login to book' });
    }
    
    const { table_id, date, time, guests } = req.body;
    const bookingNumber = `GBR-${Date.now()}`;
    
    try {
        // Find table by number
        const [table] = await pool.query(
            'SELECT table_id FROM restaurant_tables WHERE table_number = ?',
            [table_id]
        );
        
        if (table.length === 0) {
            return res.json({ success: false, message: 'Table not found' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO bookings (booking_number, user_id, table_id, booking_date, booking_time, number_of_guests, advance_payment, status) VALUES (?, ?, ?, ?, ?, ?, 1200, "Confirmed")',
            [bookingNumber, req.session.user.id, table[0].table_id, date, time, guests]
        );
        
        // Update table status
        await pool.query(
            'UPDATE restaurant_tables SET status = "Reserved" WHERE table_id = ?',
            [table[0].table_id]
        );
        
        res.json({ success: true, booking: { id: result.insertId, booking_number: bookingNumber } });
    } catch (error) {
        console.error('Booking error:', error);
        res.json({ success: false, message: 'Booking failed' });
    }
});

// Cancel booking (MySQL)
app.post('/api/bookings/:id/cancel', async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: 'Please login' });
    }
    
    const bookingId = req.params.id;
    
    try {
        // Find booking to get table_id
        const [bookings] = await pool.query(
            'SELECT table_id FROM bookings WHERE booking_id = ? AND user_id = ?',
            [bookingId, req.session.user.id]
        );
        
        if (bookings.length === 0) {
            return res.json({ success: false, message: 'Booking not found' });
        }
        
        const tableId = bookings[0].table_id;
        
        // Update booking status to 'Cancelled'
        await pool.query(
            'UPDATE bookings SET status = "Cancelled" WHERE booking_id = ? AND user_id = ?',
            [bookingId, req.session.user.id]
        );
        
        // Set table status to 'Available'
        await pool.query(
            'UPDATE restaurant_tables SET status = "Available" WHERE table_id = ?',
            [tableId]
        );
        
        res.json({ success: true, message: 'Booking cancelled' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.json({ success: false, message: 'Cancellation failed' });
    }
});

// Get user bookings
app.get('/api/my-bookings', async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, bookings: [] });
    }
    
    try {
        const [bookings] = await pool.query(
            `SELECT b.*, t.table_number, t.location 
             FROM bookings b 
             JOIN restaurant_tables t ON b.table_id = t.table_id 
             WHERE b.user_id = ? 
             ORDER BY b.booking_date DESC`,
            [req.session.user.id]
        );
        
        res.json({ success: true, bookings: bookings });
    } catch (error) {
        console.error('Bookings error:', error);
        res.json({ success: false, bookings: [] });
    }
});

// Get active offers
app.get('/api/offers', async (req, res) => {
    try {
        const [offers] = await pool.query(
            'SELECT * FROM offers WHERE status = "Live" AND valid_from <= CURDATE() AND valid_until >= CURDATE()'
        );
        res.json({ success: true, offers: offers });
    } catch (error) {
        console.error('Offers error:', error);
        res.json({ success: false, offers: [] });
    }
});

// Create order
app.post('/api/orders', async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: 'Please login' });
    }
    
    const { items, delivery_mode, delivery_address, special_instructions, total_amount } = req.body;
    const orderNumber = `ORD-${Date.now()}`;
    const subtotal = total_amount;
    const tax = Math.round(subtotal * 0.13);
    
    // Map delivery_mode ('dine-in' / 'delivery') to ENUM('Dine-in', 'Home delivery')
    let orderType = 'Dine-in';
    if (delivery_mode && delivery_mode.toLowerCase() === 'delivery') {
        orderType = 'Home delivery';
    }
    
    try {
        const [result] = await pool.query(
            'INSERT INTO orders (order_number, user_id, order_type, delivery_address, special_instructions, subtotal, tax, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "Pending")',
            [orderNumber, req.session.user.id, orderType, delivery_address || null, special_instructions || null, subtotal, tax, subtotal + tax]
        );
        
        for (const item of items) {
            // Find price from item.price (client) or query from database as fallback
            let price = item.price;
            if (price === undefined || price === null) {
                const [menuItem] = await pool.query(
                    'SELECT price FROM menu_items WHERE item_id = ?',
                    [item.id]
                );
                price = menuItem.length > 0 ? menuItem[0].price : 0;
            }
            
            await pool.query(
                'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
                [result.insertId, item.id, item.quantity, price]
            );
        }
        
        res.json({ success: true, order: { id: result.insertId, order_number: orderNumber } });
    } catch (error) {
        console.error('Order error:', error);
        res.json({ success: false, message: 'Order failed' });
    }
});

// Submit review
app.post('/api/reviews', async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: 'Please login' });
    }
    
    const { ratings, comment, booking_id } = req.body;
    
    try {
        await pool.query(
            'INSERT INTO reviews (booking_id, user_id, food_quality, staff_behaviour, ambience, overall_rating, additional_feedback) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [booking_id || null, req.session.user.id, ratings.food, ratings.staff, ratings.ambience, ratings.overall, comment]
        );
        
        res.json({ success: true, message: 'Review submitted' });
    } catch (error) {
        console.error('Review error:', error);
        res.json({ success: false, message: 'Review failed' });
    }
});

// ========== SERVE HTML PAGES ==========
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/booking', (req, res) => res.sendFile(path.join(__dirname, 'public', 'booking.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'public', 'menu.html')));
app.get('/my-bookings', (req, res) => res.sendFile(path.join(__dirname, 'public', 'my-bookings.html')));
app.get('/order', (req, res) => res.redirect('/menu'));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    const dbConnected = await testConnection();
    if (dbConnected) {
        app.listen(PORT, () => {
            console.log(`🚀 Gokyo Bistro running on http://localhost:${PORT}`);
            console.log(`✅ MySQL Database connected!`);
        });
    } else {
        console.error('❌ Make sure XAMPP is running with MySQL');
    }
};

startServer();