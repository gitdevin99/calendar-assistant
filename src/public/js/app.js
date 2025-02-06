// Check if user is authenticated with Google Calendar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();
        
        const authContainer = document.querySelector('.auth-container');
        if (data.authenticated) {
            authContainer.innerHTML = '<p class="success-message">✓ Connected to Google Calendar</p>';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
});
