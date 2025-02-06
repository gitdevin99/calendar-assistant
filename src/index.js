require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
// Configure CORS for ElevenLabs domain
app.use(cors({
    origin: ['https://elevenlabs.io', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add headers to bypass localtunnel reminder
app.use((req, res, next) => {
    res.setHeader('bypass-tunnel-reminder', 'true');
    res.setHeader('User-Agent', 'Calendar-Assistant-Bot');
    next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api')); // New API routes
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/conversation', require('./routes/conversation'));
app.use('/proxy', require('./routes/proxy')); // Proxy routes with tunnel headers

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// Update CORS settings with dynamic host
app.use(cors({
    origin: ['https://elevenlabs.io', HOST],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server URL: ${HOST}`);
});
