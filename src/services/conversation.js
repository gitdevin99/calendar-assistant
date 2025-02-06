const axios = require('axios');
const calendarService = require('./calendar');

class ConversationService {
    constructor() {
        this.agentId = 'dCe1XFhpFSpS9RPsUg9S';
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
    }

    async handleConversation(userInput) {
        try {
            const response = await axios.post(`${this.baseUrl}/chat`, {
                agent_id: this.agentId,
                text: userInput,
                context: {
                    calendar: await this.getCalendarContext()
                }
            }, {
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            // Process the agent's response and execute calendar actions if needed
            await this.processAgentResponse(response.data);

            return {
                text: response.data.text,
                audio: response.data.audio
            };
        } catch (error) {
            console.error('Error in conversation:', error);
            throw error;
        }
    }

    async getCalendarContext() {
        try {
            // Get next 7 days calendar events for context
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const slots = await calendarService.getAvailableSlots(
                now.toISOString(),
                nextWeek.toISOString()
            );
            
            return {
                available_slots: slots,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        } catch (error) {
            console.error('Error getting calendar context:', error);
            return {};
        }
    }

    async processAgentResponse(response) {
        try {
            if (response.actions) {
                for (const action of response.actions) {
                    switch (action.type) {
                        case 'schedule_appointment':
                            await calendarService.createAppointment(
                                action.data.start_time,
                                action.data.end_time,
                                action.data.summary || 'Scheduled Appointment',
                                action.data.description || 'Scheduled via AI Assistant'
                            );
                            break;
                        // Add more action types as needed
                    }
                }
            }
        } catch (error) {
            console.error('Error processing agent response:', error);
            throw error;
        }
    }

    async handleAvailabilityCheck({ start, end }) {
        const slots = await calendarService.getAvailableSlots(start, end);
        
        if (slots.length === 0) {
            return "I'm sorry, but I couldn't find any available time slots in that timeframe.";
        }

        const formattedSlots = slots.map(slot => {
            const startTime = new Date(slot.start);
            const endTime = new Date(slot.end);
            return `${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()}`;
        }).join(', ');

        return `I found the following available time slots: ${formattedSlots}`;
    }

    async handleAppointmentScheduling({ startTime, duration, summary, description }) {
        const endTime = new Date(new Date(startTime).getTime() + duration * 60000);
        
        await calendarService.createAppointment(
            startTime,
            endTime.toISOString(),
            summary,
            description
        );

        return `Great! I've scheduled your appointment for ${new Date(startTime).toLocaleString()}.`;
    }
}

module.exports = new ConversationService();
