const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendar');
const { checkAuth } = require('../services/auth');

// Get all calendar events
router.get('/calendar/events', checkAuth, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const events = await calendarService.listEvents(start_date, end_date);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get calendar availability
router.get('/calendar/availability', checkAuth, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const startDate = start_date || new Date().toISOString();
        const endDate = end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const slots = await calendarService.getAvailableSlots(startDate, endDate);
        
        const formattedSlots = slots.map(slot => ({
            start: new Date(slot.start).toLocaleString(),
            end: new Date(slot.end).toLocaleString(),
            duration: Math.floor((new Date(slot.end) - new Date(slot.start)) / (1000 * 60))
        }));

        res.json({
            available_slots: formattedSlots,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    } catch (error) {
        console.error('Error fetching calendar availability:', error);
        res.status(500).json({ error: error.message });
    }
});

// Schedule an appointment
router.post('/calendar/schedule', checkAuth, async (req, res) => {
    try {
        const { start_time, end_time, summary, description } = req.body;
        console.log('Creating appointment:', { start_time, end_time, summary, description });
        
        const appointment = await calendarService.createAppointment(
            start_time,
            end_time,
            summary || 'Scheduled Appointment',
            description || 'Scheduled via AI Assistant'
        );

        console.log('Appointment created:', appointment);

        res.json({
            success: true,
            appointment: {
                id: appointment.id,
                start: appointment.start.dateTime,
                end: appointment.end.dateTime,
                summary: appointment.summary
            }
        });
    } catch (error) {
        console.error('Error scheduling appointment:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
