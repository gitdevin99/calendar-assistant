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
        console.log('Received callback with code:', req.query.code);
        const { code } = req.query;
        console.log('Getting tokens from Google...');
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Received tokens:', tokens);
        oauth2Client.setCredentials(tokens);

        // Store tokens in session
        req.session.token = tokens;
        console.log('Session before save:', req.session);
        
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).send('Session save failed');
            }
            console.log('Session saved successfully');
            console.log('Final session state:', req.session);
            res.redirect('/');
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Check authentication status
router.get('/status', (req, res) => {
    console.log('Checking auth status. Session:', req.session);
    const isAuthenticated = !!req.session?.token;
    console.log('Is authenticated:', isAuthenticated);
    res.json({
        authenticated: isAuthenticated
    });
});

module.exports = router;
