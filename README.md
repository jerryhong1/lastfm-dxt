
<img width="1578" height="888" alt="cover photo" src="https://github.com/user-attachments/assets/df983dd4-8e43-424d-8655-6ab08a2b3304" />

# Last.fm (Unofficial) DXT

An unofficial Desktop Extension (DXT) server that provides access to Last.fm music data and listening history.

## Features

### Tools
- **Search Music** (`search_music`) - Search for tracks or artists
- **Get User Statistics** (`get_user_stats`) - Get comprehensive user listening statistics with configurable sections
- **Get Recent Tracks** (`get_recent_tracks`) - Get recently played tracks with time range filtering
- **Get Now Playing** (`get_now_playing`) - Get the currently playing track
- **Get Track Info** (`get_track_info`) - Get detailed information about a specific track
- **Get Artist Info** (`get_artist_info`) - Get detailed information about an artist
- **Get Top Artists** (`get_top_artists`) - Get a user's top artists for a specific time period
- **Get Top Tracks** (`get_top_tracks`) - Get a user's top tracks for a specific time period
- **Get Loved Tracks** (`get_loved_tracks`) - Get a user's loved/favorited tracks

## Installation

### As a Desktop Extension (DXT)

The easiest way to use this server is to install it as a Desktop Extension in Claude Desktop.

1. Download the latest `.dxt` file from the [releases page](https://github.com/jerryhong1/lastfm-mcp-server/releases)
2. In Claude Desktop, go to Settings → Developer → Install Desktop Extension
3. Select the downloaded `.dxt` file
4. Enter your Last.fm API key when prompted (get one at https://www.last.fm/api)
5. Optionally set a default username to avoid typing it repeatedly

### Manual Setup

#### Prerequisites
- Node.js 18+ 
- Last.fm API key (get one at https://www.last.fm/api)

#### Installation

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
For tools that accept time periods:
- `overall` - All time (default)
- `7day` - Last 7 days
- `1month` - Last month
- `3month` - Last 3 months  
- `6month` - Last 6 months
- `12month` - Last 12 months

### Time Range Filtering (get_recent_tracks)
- `all` - No time filtering (default)
- `today` - Last 24 hours
- `week` - Last 7 days
- `month` - Last 30 days
- `custom` - Custom time range using `custom_hours`, `from_date`, or `to_date`

### Detail Levels
All tools support a `detail_level` parameter:
- `minimal` - Just essential data (names, counts)
- `standard` - Excludes verbose metadata (default)
- `full` - Complete response with all data

### Example Queries

Ask Claude things like:
- "What's my current music taste based on my Last.fm profile?"
- "Show me what [username] is currently listening to"
- "What were my top tracks last month?"
- "Search for tracks by Radiohead"
- "Get info about the song 'Bohemian Rhapsody' by Queen"
- "Show my listening stats for the past week"

## Development

### Project Structure
```
src/
├── index.ts          # Main server entry point
├── client/
│   └── lastfm.ts     # Last.fm API client
├── types/
│   └── lastfm.ts     # TypeScript type definitions
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

