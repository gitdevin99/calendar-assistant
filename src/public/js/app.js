let calendar;

async function checkAuthStatus() {
    try {
        console.log('Checking auth status...');
        const response = await fetch('/auth/status');
        const data = await response.json();
        console.log('Auth status response:', data);
        return data.authenticated;
    } catch (error) {
        console.error('Error checking auth status:', error);
        return false;
    }
}

async function initializeApp() {
    const authContainer = document.querySelector('.auth-container');
    const calendarContainer = document.getElementById('calendar');
    
    try {
        const isAuthenticated = await checkAuthStatus();
        console.log('Is authenticated:', isAuthenticated);
        
        if (isAuthenticated) {
            authContainer.innerHTML = '<p class="success-message">✓ Connected to Google Calendar</p>';
            calendarContainer.style.display = 'block';
            await initializeCalendar();
        } else {
            authContainer.innerHTML = `
                <a href="/auth/google" class="google-signin-btn">Sign in with Google Calendar</a>
                <p class="error-message">Not authenticated. Please sign in.</p>
            `;
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        authContainer.innerHTML = `
            <p class="error-message">Error: ${error.message}</p>
            <a href="/auth/google" class="google-signin-btn">Try signing in again</a>
        `;
    }
}

async function initializeCalendar() {
    console.log('Initializing calendar...');
    const calendarEl = document.getElementById('calendar');
    
    try {
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
            },
            eventSourceFailure: function(error) {
                console.error('Calendar event fetch error:', error);
                calendarEl.innerHTML = `<p class="error-message">Error loading calendar events: ${error.message}</p>`;
            }
        });
        
        calendar.render();
        console.log('Calendar initialized successfully');
    } catch (error) {
        console.error('Error initializing calendar:', error);
        calendarEl.innerHTML = `<p class="error-message">Error initializing calendar: ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
