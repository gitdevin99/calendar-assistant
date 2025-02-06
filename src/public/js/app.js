let calendar;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();
        
        const authContainer = document.querySelector('.auth-container');
        const calendarContainer = document.getElementById('calendar');
        
        if (data.authenticated) {
            authContainer.innerHTML = '<p class="success-message">✓ Connected to Google Calendar</p>';
            calendarContainer.style.display = 'block';
            initializeCalendar();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
});

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: '/api/calendar/events',
        eventClick: function(info) {
            const event = info.event;
            const details = [
                `Title: ${event.title}`,
                `Start: ${event.start.toLocaleString()}`,
                `End: ${event.end ? event.end.toLocaleString() : 'N/A'}`,
                `Location: ${event.extendedProps.location || 'N/A'}`,
                `Description: ${event.extendedProps.description || 'N/A'}`
            ].join('\n');
            alert(details);
        },
        eventDidMount: function(info) {
            info.el.title = info.event.title;
        }
    });
    
    calendar.render();
}
