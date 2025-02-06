# AI Calendar Assistant

## Quick Deploy to Render

1. Click this button to deploy to Render:
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

2. Configure these environment variables in Render:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `GOOGLE_REDIRECT_URI`: Set this to `https://your-render-app.onrender.com/auth/google/callback`
   - `ELEVENLABS_API_KEY`: Your ElevenLabs API key

3. Once deployed, update your ElevenLabs agent with these endpoints:
   ```
   GET https://your-render-app.onrender.com/api/calendar/availability
   POST https://your-render-app.onrender.com/api/calendar/schedule
   ```

An intelligent voice-enabled calendar assistant that uses ElevenLabs for voice synthesis and Google Calendar for appointment management.

## Features

- Voice interaction using browser's Speech Recognition API
- Natural language processing for understanding calendar-related requests
- Real-time Google Calendar integration
- ElevenLabs voice synthesis for natural-sounding responses
- Appointment scheduling and availability checking

## Prerequisites

1. Node.js and npm installed
2. Google Cloud Console account with Calendar API enabled
3. ElevenLabs API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Set up Google OAuth 2.0:
   - Go to Google Cloud Console
   - Create a new project
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

5. Get your ElevenLabs API key:
   - Sign up at ElevenLabs
   - Get your API key from the profile settings

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Click "Start Speaking" to begin voice interaction
2. Speak your request (e.g., "What times are available tomorrow?" or "Schedule an appointment for 2 PM")
3. Click "Stop Speaking" when finished
4. Listen to the assistant's response

## Project Structure

- `src/`
  - `config/` - Configuration files
  - `services/` - Business logic for calendar and conversation
  - `routes/` - API route handlers
  - `public/` - Frontend assets
    - `css/` - Stylesheets
    - `js/` - Frontend JavaScript

## Security Notes

- Store sensitive credentials in `.env` file (not in version control)
- Implement proper OAuth flow for production
- Add rate limiting for API endpoints
- Use HTTPS in production

## License

MIT
