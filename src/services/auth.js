const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Middleware to check authentication
const checkAuth = async (req, res, next) => {
    console.log('Checking auth...');
    if (!req.session?.token) {
        console.log('No token in session');
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        // Set credentials from session
        oauth2Client.setCredentials(req.session.token);

        // Check if token is expired and needs refresh
        if (oauth2Client.isTokenExpiring()) {
            console.log('Token is expiring, refreshing...');
            const { credentials } = await oauth2Client.refreshAccessToken();
            req.session.token = credentials;
            oauth2Client.setCredentials(credentials);
        }

        // Add oauth2Client to request for use in route handlers
        req.oauth2Client = oauth2Client;
        next();
    } catch (error) {
        console.error('Auth check error:', error);
        // Clear invalid token
        delete req.session.token;
        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = {
    oauth2Client,
    checkAuth,
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
