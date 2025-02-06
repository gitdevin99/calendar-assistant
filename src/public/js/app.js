let calendar;

async function fetchWithStatus(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'include'
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return response.json();
}

async function checkAuthStatus() {
    try {
        console.log('Checking auth status...');
        const data = await fetchWithStatus('/auth/status');
        console.log('Auth status response:', data);
        return data.authenticated;
    } catch (error) {
        console.error('Error checking auth status:', error);
        throw error;
    }
}

async function fetchCalendarEvents() {
    try {
        console.log('Fetching calendar events...');
        const events = await fetchWithStatus('/api/calendar/events');
        console.log('Calendar events received:', events);
        return events;
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
}

async function initializeApp() {
    const authContainer = document.querySelector('.auth-container');
    const calendarContainer = document.getElementById('calendar');
    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-container';
    authContainer.appendChild(statusContainer);
    
    try {
        // Check debug info first
        const debugInfo = await fetchWithStatus('/auth/debug');
        console.log('Debug info:', debugInfo);
        statusContainer.innerHTML = `<pre class="debug-info">Debug Info: ${JSON.stringify(debugInfo, null, 2)}</pre>`;

        const isAuthenticated = await checkAuthStatus();
        console.log('Is authenticated:', isAuthenticated);
        
        if (isAuthenticated) {
            authContainer.innerHTML = `
                <p class="success-message">✓ Connected to Google Calendar</p>
                <button onclick="window.location.href='/auth/logout'" class="logout-btn">Sign Out</button>
            `;
            calendarContainer.style.display = 'block';
            await initializeCalendar();
        } else {
            authContainer.innerHTML = `
                <p class="error-message">Not authenticated. Please sign in.</p>
                <a href="/auth/google" class="google-signin-btn">Sign in with Google Calendar</a>
            `;
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        authContainer.innerHTML = `
            <p class="error-message">Error: ${error.message}</p>
            <a href="/auth/google" class="google-signin-btn">Try signing in again</a>
            <pre class="error-details">${error.stack}</pre>
        `;
    }
}

async function initializeCalendar() {
    console.log('Initializing calendar...');
    const calendarEl = document.getElementById('calendar');
    
    try {
        // First try to fetch events directly to check if we can access them
        const events = await fetchCalendarEvents();
        console.log('Successfully pre-fetched events:', events);

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: async function(info, successCallback, failureCallback) {
                try {
                    const events = await fetchCalendarEvents();
                    successCallback(events);
                } catch (error) {
                    console.error('Failed to fetch events:', error);
                    failureCallback(error);
                    calendarEl.innerHTML = `<p class="error-message">Error loading events: ${error.message}</p>`;
                }
            },
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
            }
        });
        
        calendar.render();
        console.log('Calendar initialized successfully');
    } catch (error) {
        console.error('Error initializing calendar:', error);
        calendarEl.innerHTML = `
            <p class="error-message">Error initializing calendar: ${error.message}</p>
            <pre class="error-details">${error.stack}</pre>
        `;
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
