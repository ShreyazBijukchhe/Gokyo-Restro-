-- Create Database
CREATE DATABASE IF NOT EXISTS gokyo_bistro;
USE gokyo_bistro;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('Admin', 'Member', 'Visitor') DEFAULT 'Visitor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurant Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
    table_id INT PRIMARY KEY AUTO_INCREMENT,
    table_number VARCHAR(10) NOT NULL,
    capacity INT NOT NULL,
    location ENUM('Indoor', 'Outdoor', 'Private') DEFAULT 'Indoor',
    status ENUM('Available', 'Occupied', 'Reserved') DEFAULT 'Available'
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL,
    category ENUM('Starters', 'Mains', 'Drinks', 'Beverages') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    table_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    number_of_guests INT NOT NULL,
    advance_payment DECIMAL(10,2) DEFAULT 1200.00,
    status ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(table_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    booking_id INT NULL,
    order_type ENUM('Dine-in', 'Home delivery') DEFAULT 'Dine-in',
    delivery_address TEXT,
    special_instructions TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id INT NULL,
    order_id INT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('eSewa', 'Khalti', 'Card', 'Cash') NOT NULL,
    payment_status ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    food_quality INT CHECK (food_quality BETWEEN 1 AND 5),
    staff_behaviour INT CHECK (staff_behaviour BETWEEN 1 AND 5),
    ambience INT CHECK (ambience BETWEEN 1 AND 5),
    overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
    additional_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
    offer_id INT PRIMARY KEY AUTO_INCREMENT,
    offer_title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_percentage INT DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    applicable_to ENUM('All users', 'Members only') DEFAULT 'All users',
    status ENUM('Live', 'Expired', 'Scheduled') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Restaurant Tables
INSERT INTO restaurant_tables (table_number, capacity, location) VALUES
('T1', 2, 'Indoor'),
('T2', 4, 'Indoor'),
('T3', 2, 'Outdoor'),
('T4', 6, 'Indoor'),
('T5', 4, 'Outdoor'),
('T6', 2, 'Private'),
('T7', 4, 'Indoor'),
('T8', 6, 'Outdoor');

-- Insert Sample Menu Items
INSERT INTO menu_items (item_name, category, price, description) VALUES
('Thukpa Noodles', 'Mains', 350, 'Traditional Tibetan noodle soup'),
('Garden Salad', 'Starters', 280, 'Fresh mixed greens with house dressing'),
('Grilled Chicken', 'Mains', 580, 'Juicy grilled chicken with herbs'),
('Masala Tea', 'Beverages', 120, 'Traditional Nepali spiced tea'),
('Fresh Juice', 'Beverages', 180, 'Fresh seasonal fruit juice'),
('Cappuccino', 'Beverages', 200, 'Classic Italian coffee with frothy milk'),
('Momo (Steamed)', 'Starters', 220, 'Hand-crafted dumplings with achar sauce'),
('Dal Bhat Thali', 'Mains', 450, 'Nepali staple rice, lentils, curry, and greens');

-- Insert Sample Offers
INSERT INTO offers (offer_title, description, discount_percentage, valid_from, valid_until, status) VALUES
('20% off on weekdays', 'Get 20% discount on all orders placed Monday to Friday', 20, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Live'),
('Birthday free dessert', 'Free dessert on your birthday month', 100, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'Live');

-- Insert Sample User (password: password123)
INSERT INTO users (full_name, email, phone, password, user_type) VALUES
('Test User', 'test@email.com', '9812345678', '$2a$10$rVqKpXvNqYxZqLpOjKmNoQ6XqWtYzXaBcDeFgHiJkLmNoPqRsTuVwX', 'Visitor');