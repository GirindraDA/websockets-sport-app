# Sportz - Sports Commentary API

A real-time sports commentary API built with Express.js, Drizzle ORM, WebSockets, and Arcjet security. This application provides REST endpoints to manage matches and commentary, with real-time updates via WebSocket.

## Features

- 🏏 **Match Management**: Create and manage sports matches
- 💬 **Commentary System**: Real-time commentary updates with WebSocket broadcasts
- 🔒 **Security**: Built-in protection with Arcjet (bot detection, rate limiting, DDoS shield)
- 🗄️ **Database**: PostgreSQL with Drizzle ORM migrations
- 📡 **WebSocket Server**: Real-time event broadcasting to subscribed clients
- ✅ **Validation**: Zod schema validation for all requests

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL + Drizzle ORM
- **WebSocket**: ws library
- **Validation**: Zod
- **Security**: Arcjet
- **Environment**: dotenv

## Installation

1. **Install dependencies**
```bash
npm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup Database**
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sportz

# Server
PORT=8000
HOST=0.0.0.0

# Security (Arcjet)
ARCJET_API_KEY=your_arcjet_api_key
ARCJET_MODE=DRY_RUN  # or LIVE
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ Yes |
| `PORT` | Server port | `8000` | ❌ No |
| `HOST` | Server host | `0.0.0.0` | ❌ No |
| `ARCJET_API_KEY` | Arcjet API key for security | - | ✅ Yes |
| `ARCJET_MODE` | Arcjet mode: DRY_RUN or LIVE | `LIVE` | ❌ No |

## Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:8000` and WebSocket on `ws://localhost:8000/ws`

## API Endpoints

### Matches

- `GET /matches` - List all matches
- `POST /matches` - Create a new match
- `GET /matches/:id` - Get match details
- `PATCH /matches/:id` - Update match scores

### Commentary

- `GET /matches/:id/commentary` - Get commentary for a match
- `POST /matches/:id/commentary` - Add commentary to a match

## WebSocket Server

Connect to `ws://localhost:8000/ws`

### WebSocket Messages

**Subscribe to match updates:**
```json
{"type": "subscribe", "matchId": 1}
```

**Response:**
```json
{"type": "subscribed", "matchId": 1}
```

**Receive commentary broadcasts:**
```json
{"type": "commentary", "data": {"id": 1, "matchId": 1, "message": "...", ...}}
```

**Unsubscribe:**
```json
{"type": "unsubscribe", "matchId": 1}
```

## Testing with Postman

1. **Create a Match**
   - Method: `POST`
   - URL: `http://localhost:8000/matches`
   - Headers: Add `accept: application/json`, `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`
   - Body (JSON):
   ```json
    {
        "sport": "football",
        "homeTeam": "Venezia",
        "awayTeam": "Como",
        "startTime": "2026-02-05T13:00:00Z",
        "endTime": "2026-02-05T15:00:00Z"
    }
   ```

2. **Add Commentary**
   - Method: `POST`
   - URL: `http://localhost:8000/matches/1/commentary`
   - Headers: Add `accept: application/json`, `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36`
   - Body (JSON):
   ```json
   {
        "minute": 79,
        "sequence": 121,
        "period": "2nd half",
        "eventType": "goal",
        "actor": "Haaland",
        "team": "Manchaster City",
        "message": "Goal!",
        "metadata": {"assist": "Sam witwicky"},
        "tags": ["goal", "shoot", "Assist"]
   }
   ```

3. **Get Commentary**
   - Method: `GET`
   - URL: `http://localhost:8000/matches/1/commentary?limit=10`

## Testing with WebSocket (wscat)

```bash
# Connect to WebSocket
wscat -c ws://localhost:8000/ws

# Subscribe to match 1
{"type": "subscribe", "matchId": 1}

# You'll receive commentary updates in real-time when POST requests are made
```

## Project Structure

```
sportz/
├── src/
│   ├── index.js              # Express app setup
│   ├── arcjet.js             # Security configuration
│   ├── db/
│   │   ├── db.js             # Database connection
│   │   └── schema.js         # Drizzle ORM schema
│   ├── routes/
│   │   ├── matches.js        # Match routes
│   │   └── commentary.js     # Commentary routes
│   ├── validation/
│   │   ├── matches.js        # Match validation schemas
│   │   └── commentary.js     # Commentary validation schemas
│   ├── utils/
│   │   └── match-status.js   # Match status utilities
│   └── ws/
│       └── server.js         # WebSocket server
├── drizzle/                  # Database migrations
├── .env                      # Environment variables (git ignored)
├── .env.example              # Environment template
├── drizzle.config.js         # Drizzle configuration
├── package.json
└── README.md
```

## Database Schema

### Matches Table
- `id` (serial, primary key)
- `sport` (text)
- `homeTeam` (text)
- `awayTeam` (text)
- `status` (enum: scheduled, live, finished)
- `startTime` (timestamp)
- `endTime` (timestamp)
- `homeScore` (integer)
- `awayScore` (integer)
- `createdAt` (timestamp)

### Commentary Table
- `id` (serial, primary key)
- `matchId` (integer, foreign key)
- `minute` (integer)
- `sequence` (integer)
- `period` (text)
- `eventType` (text)
- `actor` (text)
- `team` (text)
- `message` (text)
- `metadata` (jsonb)
- `tags` (text array)
- `createdAt` (timestamp)

## Security Features

### Arcjet Protection
- **Shield**: DDoS protection
- **Bot Detection**: Identifies and blocks bot traffic (except search engines and preview services)
- **Rate Limiting**: 50 requests per 10 seconds (HTTP), 5 per 2 seconds (WebSocket)

### Validation
All inputs are validated using Zod schemas before processing.

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": []
}
```

## Development

### Database Management
```bash
# Generate new migration
npm run db:generate

# Apply pending migrations
npm run db:migrate
```

