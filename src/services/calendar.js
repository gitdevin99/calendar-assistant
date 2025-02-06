const { google } = require('googleapis');
const { oauth2Client } = require('./auth');

async function listEvents(startDate, endDate) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log('Fetching events from', startDate, 'to', endDate);
    
    try {
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startDate || new Date().toISOString(),
            timeMax: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });

        console.log('Found', response.data.items.length, 'events');
        return response.data.items.map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description,
            location: event.location
        }));
    } catch (error) {
        console.error('Error fetching events:', error);
        if (error.response) {
            console.error('Google API Error:', {
                status: error.response.status,
                message: error.response.data.error.message
            });
        }
        throw error;
    }
}

async function getAvailableSlots(startTime, endTime) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    try {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startTime,
                timeMax: endTime,
                items: [{ id: 'primary' }]
            }
        });

        const busySlots = response.data.calendars.primary.busy;
        return findFreeSlots(startTime, endTime, busySlots);
    } catch (error) {
        console.error('Error fetching calendar slots:', error);
        throw error;
    }
}

function findFreeSlots(start, end, busySlots) {
    const freeSlots = [];
    let currentTime = new Date(start);
    const endTime = new Date(end);

    for (const busy of busySlots) {
        const busyStart = new Date(busy.start);
        if (currentTime < busyStart) {
            freeSlots.push({
                start: currentTime.toISOString(),
                end: busyStart.toISOString()
            });
        }
        currentTime = new Date(busy.end);
    }

    if (currentTime < endTime) {
        freeSlots.push({
            start: currentTime.toISOString(),
            end: endTime.toISOString()
        });
    }

    return freeSlots;
}

async function createAppointment(startTime, endTime, summary, description) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    try {
        const event = {
            summary,
            description,
            start: {
                dateTime: startTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        return response.data;
    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
}

module.exports = {
    listEvents,
    getAvailableSlots,
    createAppointment
};
