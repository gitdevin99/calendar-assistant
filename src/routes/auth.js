const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { oauth2Client } = require('../services/auth');

// Generate Google OAuth URL
router.get('/google', (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    res.redirect(url);
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Store tokens in session
        req.session.token = tokens;
        req.session.save(() => {
            res.redirect('/');
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Check authentication status
router.get('/status', (req, res) => {
    res.json({
        authenticated: !!req.session.token
    });
});

module.exports = router;
