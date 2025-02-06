const express = require('express');
const axios = require('axios');

// Configure axios defaults for localtunnel
axios.defaults.headers.common['bypass-tunnel-reminder'] = 'true';
axios.defaults.headers.common['User-Agent'] = 'Calendar-Assistant-Bot';
const router = express.Router();
const calendarService = require('../services/calendar');

// Middleware to verify API password
const verifyApiPassword = (req, res, next) => {
    const password = req.headers.password || req.query.password;
    const expectedPassword = process.env.TUNNEL_PASSWORD;
    
    if (!expectedPassword) {
        console.error('TUNNEL_PASSWORD environment variable not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (password === expectedPassword) {
        next();
    } else {
        res.status(401).json({ error: 'Invalid or missing password' });
    }
};

// Apply password verification to all routes
router.use(verifyApiPassword);

// Test endpoint to verify access
router.get('/test', (req, res) => {
    res.json({ message: 'API is accessible!' });
});

// Endpoint for ElevenLabs agent to get calendar availability
router.get('/calendar/availability', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const startDate = start_date || new Date().toISOString();
        const endDate = end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const slots = await calendarService.getAvailableSlots(startDate, endDate);
        
        // Format the response in a way that's easy for the agent to understand
        const formattedSlots = slots.map(slot => ({
            start: new Date(slot.start).toLocaleString(),
            end: new Date(slot.end).toLocaleString(),
            duration: Math.floor((new Date(slot.end) - new Date(slot.start)) / (1000 * 60)) // duration in minutes
        }));

        res.json({
            available_slots: formattedSlots,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    } catch (error) {
        console.error('Error fetching calendar availability:', error);
        res.status(500).json({ error: 'Failed to fetch calendar availability' });
    }
});

// Endpoint for ElevenLabs agent to schedule appointments
router.post('/calendar/schedule', async (req, res) => {
    console.log('Received schedule request:', req.body);
    console.log('Auth status:', req.user ? 'Authenticated' : 'Not authenticated');

    try {
        if (!req.user) {
            throw new Error('Google Calendar authentication required. Please sign in first.');
        }

        const { start_time, end_time, summary, description } = req.body;
        console.log('Creating appointment with:', { start_time, end_time, summary, description });
        
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
        const statusCode = error.message.includes('authentication') ? 401 : 500;
        res.status(statusCode).json({ 
            error: error.message || 'Failed to schedule appointment',
            auth_status: req.user ? 'authenticated' : 'not_authenticated'
        });
    }
});

module.exports = router;
