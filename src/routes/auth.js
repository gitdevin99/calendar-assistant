const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { oauth2Client } = require('../services/auth');

// Debug endpoint to check session and request state
router.get('/debug', (req, res) => {
    console.log('Debug request received');
    res.json({
        session: {
            id: req.session?.id,
            hasToken: !!req.session?.token,
            cookie: req.session?.cookie,
        },
        headers: {
            cookie: req.headers.cookie,
            origin: req.headers.origin,
            referer: req.headers.referer,
            'user-agent': req.headers['user-agent']
        }
    });
});

// Generate Google OAuth URL
router.get('/google', (req, res) => {
    console.log('Starting OAuth flow...');
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    console.log('Generated OAuth URL:', url);
    res.redirect(url);
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
    console.log('OAuth callback received');
    try {
        if (!req.query.code) {
            console.error('No code received in callback');
            return res.status(400).send('No authorization code received');
        }

        console.log('Getting tokens with code:', req.query.code);
        const { tokens } = await oauth2Client.getToken(req.query.code);
        console.log('Received tokens:', {
            access_token: tokens.access_token ? '(present)' : '(missing)',
            refresh_token: tokens.refresh_token ? '(present)' : '(missing)',
            expiry_date: tokens.expiry_date
        });

        // Store tokens in session
        req.session.token = tokens;
        
        // Force session save and wait for it
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully');
                    resolve();
                }
            });
        });

        console.log('Final session state:', {
            id: req.session.id,
            hasToken: !!req.session.token,
            cookie: req.session.cookie
        });

        res.redirect('/');
    } catch (error) {
        console.error('OAuth callback error:', error);
        if (error.response) {
            console.error('Google API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        res.status(500).send(`Authentication failed: ${error.message}`);
    }
});

// Check authentication status
router.get('/status', (req, res) => {
    console.log('Auth status check:', {
        sessionId: req.session?.id,
        hasToken: !!req.session?.token,
        headers: {
            cookie: req.headers.cookie,
            origin: req.headers.origin
        }
    });

    res.json({
        authenticated: !!req.session?.token,
        sessionId: req.session?.id
    });
});

// Logout endpoint
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
    });
});

module.exports = router;
