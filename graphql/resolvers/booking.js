const Event = require('../../models/event');
const Booking = require('../../models/booking');
const {transformBooking, transformEvent} = require('./merge');

module.exports = {
    bookings: async (args, req) => {
        if (!req.isAuth) {
            throw new Error('User is not authenticated');
        }
        try {
            const bookings = await Booking.find();
            return bookings.map(booking => {
                return transformBooking(booking);
            })
        } catch (error) {
            throw error;
        }
    },
    bookEvent: async (args, req) => {
        if (!req.isAuth) {
            throw new Error('User is not authenticated');
        }
        const fetchedEvent = await Event.findOne({_id: args.eventId});
        const booking = new Booking({
            user: '601f33178343c74548cfc005',
            event: fetchedEvent
        });
        const result = await booking.save();
        return transformBooking(result);
    },
    cancelBooking: async (args) => {
        if (!req.isAuth) {
            throw new Error('User is not authenticated');
        }
        try {
            const booking = await Booking.findById(args.bookingId).populate('event');
            const event = transformEvent(booking.event);
            await Booking.deleteOne({_id: args.bookingId});
            return event;
        } catch (error) {
            throw error;
        }
    }
};
