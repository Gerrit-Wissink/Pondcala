# Pondcala

A multiplayer Mancala game built with Go backend and React frontend.

## Prerequisites

- Go 1.21 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher

## Backend Setup

### Setting Go Environment Variables

The backend requires proper Go environment variables to be set. Add these to your shell configuration file:

**For zsh (macOS default):**

Edit `~/.zshrc`:
```bash
nano ~/.zshrc
```

Add the following lines:
```bash
export GOPATH=$HOME/go
export GOMODCACHE=$HOME/go/pkg/mod
export PATH=$PATH:$GOPATH/bin
```

Save and reload:
```bash
source ~/.zshrc
```

**For bash:**

Edit `~/.bashrc` or `~/.bash_profile`:
```bash
nano ~/.bashrc
```

Add the same export lines as above, then reload:
```bash
source ~/.bashrc
```

**Verify the setup:**
```bash
go env GOPATH
go env GOMODCACHE
```

### Installing Dependencies

Navigate to the backend directory:
```bash
cd backend
```

Install Go dependencies:
```bash
go mod download
# or
go mod tidy
```

### Database Setup

1. Create a PostgreSQL database named `pondcala`
2. Create a user with ID 0 for system operations:
```sql
-- Allow manual ID insertion
SET session_replication_role = replica;

-- Insert the system user
INSERT INTO "User" ("id", "username", "password", "isOnline")
VALUES (0, 'SYSTEM', 'SYSTEM_PLACEHOLDER', false);

-- Re-enable constraints
SET session_replication_role = DEFAULT;
```

### Running the Backend

```bash
cd backend
go run .
```

The server will start on `http://localhost:8080`

## Frontend Setup

### Installing Dependencies

Navigate to the frontend directory:
```bash
cd frontend/Pondcala
npm install
```

### Running the Frontend (Development)

```bash
npm run dev
```

The development server will start on `http://localhost:8081`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory and are served by the Go backend at `http://localhost:8080`

## Project Structure

```
Pondcala/
├── backend/
│   ├── business/        # Business logic layer
│   ├── data/            # Data access layer
│   │   ├── dbmethods/   # Database operations
│   │   └── models/      # Data models
│   ├── service/         # HTTP handlers and WebSocket
│   ├── static/          # Compiled frontend assets
│   └── main.go          # Entry point
└── frontend/
    └── Pondcala/
        ├── src/
        │   ├── components/  # React components
        │   ├── pages/       # Page components
        │   └── utils/       # Utilities (API, WebSocket, etc.)
        └── public/          # Static assets
```

## Features

- Real-time multiplayer gameplay via WebSockets
- Game invitations and matchmaking
- Lobby chat and in-game chat
- Active game tracking
- Game state persistence
- User authentication with sessions

## Development Notes

### Session Management
- Session cookies last 24 hours
- Currently set to `HttpOnly: false` for development
- Change to `HttpOnly: true` and `Secure: true` for production

### WebSocket Events
- `lobby-msg` - Lobby chat messages
- `game-msg` - Game chat messages
- `game-turn` - Game turn updates
- `invite` - Game invitations
- `game-created` - New game notifications
- `game-end` - Game completion

### Database Schema
- Tables use PascalCase (e.g., `User`, `Game`, `GameTurn`)
- Columns use camelCase (e.g., `gameID`, `hostPonds`)
- GORM uses quoted identifiers to preserve casing

## Troubleshooting

### Git Push Issues
If you get HTTP 400 errors when pushing:
```bash
# Check for large files
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sed -n 's/^blob //p' | \
  sort --numeric-sort --key=2 | \
  tail -20

# Remove large files from history
brew install git-filter-repo
git filter-repo --path backend/backend --invert-paths --force
git push origin master --force
```

### GORM Array Types
The project uses `pq.Int64Array` for PostgreSQL integer arrays in the `GameTurn` model. Make sure `github.com/lib/pq` is installed:
```bash
go get github.com/lib/pq
```

### Frontend Build Issues
If the frontend build fails, clear the cache:
```bash
cd frontend/Pondcala
rm -rf node_modules package-lock.json
npm install
npm run build
```

## License

MIT
