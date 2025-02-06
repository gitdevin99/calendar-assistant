const express = require('express');
const router = express.Router();
const axios = require('axios');

// Tunnel configuration
const TUNNEL_PASSWORD = '0.227.76.143';
const BASE_URL = 'https://my-calendar-assistant.loca.lt';

// Configure axios defaults
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'bypass-tunnel-reminder': 'true',
        'User-Agent': 'Calendar-Assistant-Bot',
        'Authorization': `Basic ${Buffer.from(`:${TUNNEL_PASSWORD}`).toString('base64')}`
    }
});

// Proxy endpoint for calendar availability
router.get('/availability', async (req, res) => {
    try {
        const response = await axiosInstance.get('/api/calendar/availability');
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying availability request:', error);
        res.status(500).json({ error: 'Failed to fetch calendar availability' });
    }
});

// Proxy endpoint for scheduling
router.post('/schedule', async (req, res) => {
    try {
        const response = await axiosInstance.post('/api/calendar/schedule', req.body);
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying schedule request:', error);
        res.status(500).json({ error: 'Failed to schedule appointment' });
    }
});

module.exports = router;
