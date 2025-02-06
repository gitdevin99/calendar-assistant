const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class CalendarService {
    constructor() {
        this.oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    async getAvailableSlots(startTime, endTime) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        
        try {
            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: startTime,
                    timeMax: endTime,
                    items: [{ id: 'primary' }]
                }
            });

            const busySlots = response.data.calendars.primary.busy;
            return this.findFreeSlots(startTime, endTime, busySlots);
        } catch (error) {
            console.error('Error fetching calendar slots:', error);
            throw error;
        }
    }

    findFreeSlots(start, end, busySlots) {
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

    async createAppointment(startTime, endTime, summary, description) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        
        try {
            const event = {
                summary,
                description,
                start: {
                    dateTime: startTime,
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: endTime,
                    timeZone: 'UTC'
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
}

module.exports = new CalendarService();
