const express = require('express');
const router = express.Router();

// Get calendar events
router.get('/events', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const start = req.query.start || new Date().toISOString();
        const end = req.query.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: start,
            timeMax: end,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items.map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description,
            location: event.location
        }));

        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
});
const calendarService = require('../services/calendar');

router.get('/available-slots', async (req, res) => {
    try {
        const { startTime, endTime } = req.query;
        const slots = await calendarService.getAvailableSlots(startTime, endTime);
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/appointment', async (req, res) => {
    try {
        const { startTime, endTime, summary, description } = req.body;
        const appointment = await calendarService.createAppointment(
            startTime,
            endTime,
            summary,
            description
        );
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
