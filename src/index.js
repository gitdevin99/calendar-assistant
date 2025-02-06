require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const Redis = require('redis');
const connectRedis = require('connect-redis');

// Initialize Redis client
const RedisStore = connectRedis(session);
const redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    legacyMode: true
});

redisClient.connect().catch(console.error);

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

const app = express();

// Middleware
// Configure CORS
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'https://elevenlabs.io',
            'http://localhost:3001',
            'https://calendar-assistant-xq3t.onrender.com',
            'https://accounts.google.com'
        ];
        callback(null, allowedOrigins.includes(origin) || !origin);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'calendar.sid'
}));

// Add Redis error handling middleware
app.use((req, res, next) => {
    if (!req.session) {
        console.error('Session store is not available');
        return next(new Error('Session store is not available'));
    }
    next();
});

// Debug middleware to log session state
app.use((req, res, next) => {
    console.log('Session Debug:', {
        hasSession: !!req.session,
        sessionID: req.session?.id,
        hasToken: !!(req.session && req.session.token),
        cookies: req.headers.cookie
    });
    next();
});

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
