const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Configure OAuth2 settings
oauth2Client.setCredentials({
    access_type: 'offline',
    prompt: 'consent'
});

module.exports = {
    oauth2Client,
    getAuthUrl: () => {
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
            ],
            prompt: 'consent'
        });
    }
};
