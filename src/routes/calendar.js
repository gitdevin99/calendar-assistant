const express = require('express');
const router = express.Router();
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
