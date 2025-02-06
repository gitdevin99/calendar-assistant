const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendar');

// Webhook for checking availability
router.post('/check-availability', async (req, res) => {
    try {
        const { startTime, endTime } = req.body;
        
        // Validate the time format
        if (!startTime || !endTime) {
            return res.json({
                available: false,
                message: "Please provide both start and end time"
            });
        }

        const slots = await calendarService.getAvailableSlots(startTime, endTime);
        
        // If there are available slots that match the requested time
        const isAvailable = slots.some(slot => {
            const slotStart = new Date(slot.start);
            const slotEnd = new Date(slot.end);
            const requestStart = new Date(startTime);
            const requestEnd = new Date(endTime);
            
            return slotStart <= requestStart && slotEnd >= requestEnd;
        });

        if (isAvailable) {
            return res.json({
                available: true,
                message: "The requested time slot is available"
            });
        } else {
            // Find the next available slot
            const nextSlot = slots.find(slot => {
                const slotStart = new Date(slot.start);
                return slotStart > new Date(startTime);
            });

            return res.json({
                available: false,
                message: nextSlot 
                    ? `The requested time is not available. The next available slot starts at ${new Date(nextSlot.start).toLocaleString()}`
                    : "The requested time is not available and no alternative slots were found"
            });
        }
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: 'Failed to check availability' });
    }
});

// Webhook for scheduling appointments
router.post('/schedule', async (req, res) => {
    try {
        const { startTime, endTime, summary, description } = req.body;
        
        // First check if the slot is available
        const slots = await calendarService.getAvailableSlots(startTime, endTime);
        const isAvailable = slots.some(slot => {
            const slotStart = new Date(slot.start);
            const slotEnd = new Date(slot.end);
            const requestStart = new Date(startTime);
            const requestEnd = new Date(endTime);
            
            return slotStart <= requestStart && slotEnd >= requestEnd;
        });

        if (!isAvailable) {
            return res.json({
                success: false,
                message: "The requested time slot is not available"
            });
        }

        // Schedule the appointment
        const appointment = await calendarService.createAppointment(
            startTime,
            endTime,
            summary || "Scheduled Appointment",
            description || "Appointment scheduled via AI Assistant"
        );

        res.json({
            success: true,
            message: "Appointment scheduled successfully",
            appointment
        });
    } catch (error) {
        console.error('Error scheduling appointment:', error);
        res.status(500).json({ error: 'Failed to schedule appointment' });
    }
});

module.exports = router;
