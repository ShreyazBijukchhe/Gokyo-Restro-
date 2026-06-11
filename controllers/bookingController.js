const BookingModel = require('../models/BookingModel');

class BookingController {
    static async showBookingForm(req, res) {
        const { date, time, guests } = req.query;
        let availableTables = [];
        if (date && time && guests) {
            availableTables = await BookingModel.getAvailableTables(date, time, parseInt(guests));
        }
        res.render('user/book-table', { title: 'Book a Table', date: date || '', time: time || '', guests: guests || '', availableTables });
    }

    static async createBooking(req, res) {
        if (!req.session.user) return res.redirect('/login');
        const { table_id, booking_date, booking_time, number_of_guests } = req.body;
        try {
            const bookingNumber = BookingModel.generateBookingNumber();
            const bookingId = await BookingModel.create({
                booking_number: bookingNumber,
                user_id: req.session.user.id,
                table_id: table_id,
                booking_date: booking_date,
                booking_time: booking_time,
                number_of_guests: number_of_guests,
                advance_payment: 1200
            });
            req.session.pendingBooking = { id: bookingId, amount: 1200 };
            res.redirect(`/payment?booking_id=${bookingId}&amount=1200`);
        } catch (error) {
            res.redirect('/booking?error=Booking failed');
        }
    }

    static async showMyBookings(req, res) {
        if (!req.session.user) return res.redirect('/login');
        const bookings = await BookingModel.getUserBookings(req.session.user.id);
        res.render('user/my-bookings', { title: 'My Bookings', bookings });
    }

    static async cancelBooking(req, res) {
        const { id } = req.params;
        await BookingModel.cancel(id);
        res.redirect('/my-bookings');
    }
}

module.exports = BookingController;