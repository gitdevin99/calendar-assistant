const express = require('express');
const { google } = require('googleapis');
const { oauth2Client } = require('../services/auth');
const router = express.Router();

// Get calendar events
router.get('/events', async (req, res) => {
    console.log('Calendar events request received');
    try {
        // Check if user is authenticated via session
        console.log('Session state:', {
            hasSession: !!req.session,
            hasToken: !!(req.session && req.session.token),
            sessionID: req.session?.id
        });

        if (!req.session || !req.session.token) {
            console.log('No valid session or token found');
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Set credentials from session token
        console.log('Setting OAuth credentials...');
        oauth2Client.setCredentials(req.session.token);

        const start = req.query.start || new Date().toISOString();
        const end = req.query.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        console.log('Time range:', { start, end });

        console.log('Initializing Google Calendar service...');
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        console.log('Fetching events from Google Calendar...');
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: start,
            timeMax: end,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log(`Found ${response.data.items.length} events`);
        const events = response.data.items.map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description,
            location: event.location
        }));

        console.log('Sending events to client');
        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        if (error.response) {
            console.error('Google API Error Details:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        if (error.code === 401 || (error.response && error.response.status === 401)) {
            console.log('Authentication error - token may have expired');
            return res.status(401).json({ 
                error: 'Authentication expired',
                details: error.message
            });
        }
        res.status(500).json({ 
            error: 'Failed to fetch calendar events',
            details: error.message
        });
    }
});

module.exports = router;
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
