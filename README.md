# Last.fm MCP Server

A Model Context Protocol (MCP) server that provides access to Last.fm music data and listening history.

## Features

### Resources
- **User Profile**: `lastfm://user/{username}/profile` - Get user information and statistics
- **Recent Tracks**: `lastfm://user/{username}/recent` - Get recently scrobbled tracks
- **Now Playing**: `lastfm://user/{username}/nowplaying` - Get currently playing track
- **Top Artists**: `lastfm://user/{username}/top/artists/{period}` - Get top artists for a time period
- **Top Tracks**: `lastfm://user/{username}/top/tracks/{period}` - Get top tracks for a time period
- **Loved Tracks**: `lastfm://user/{username}/loved` - Get user's loved/favorited tracks

### Tools
- **search_music** - Search for tracks or artists
- **get_user_stats** - Get comprehensive user listening statistics
- **get_track_info** - Get detailed information about a specific track
- **get_artist_info** - Get detailed information about an artist
- **compare_users** - Compare listening habits between two users
- **get_recommendations** - Get music recommendations based on user's taste

## Setup

### Prerequisites
- Node.js 18+ 
- Last.fm API key (get one at https://www.last.fm/api)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lastfm-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Set your Last.fm API key:
```bash
export LASTFM_API_KEY="your-api-key-here"
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

## Usage

### With Claude Desktop

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lastfm": {
      "command": "node",
      "args": ["/path/to/lastfm-mcp-server/dist/index.js"],
      "env": {
        "LASTFM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## API Reference

### Time Periods
For resources and tools that accept time periods:
- `overall` - All time (default)
- `7day` - Last 7 days
- `1month` - Last month
- `3month` - Last 3 months  
- `6month` - Last 6 months
- `12month` - Last 12 months

### Example Queries

Ask Claude things like:
- "What's my current music taste based on my Last.fm profile?"
- "Show me what [username] is currently listening to"
- "Compare my music taste with [friend's username]"
- "Find similar artists to my top 5 most played artists"
- "What were my top tracks last month?"

## Development

### Project Structure
```
src/
├── index.ts          # Main server entry point
├── client/
│   └── lastfm.ts     # Last.fm API client
├── types/
│   └── lastfm.ts     # TypeScript type definitions
├── resources/
│   └── index.ts      # MCP resource handlers
└── tools/
    └── index.ts      # MCP tool implementations
```

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

## License

MIT