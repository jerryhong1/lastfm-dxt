# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm run dev` - Build and run the server in development mode
- `npm start` - Run the compiled server from `dist/index.js`

### Testing
- `npm test` - Currently returns error (no tests configured)
- Test with MCP Inspector: `npx @modelcontextprotocol/inspector node dist/index.js`

## Project Architecture

This is a Model Context Protocol (MCP) server that provides Last.fm music data and listening history access. Built with TypeScript and the FastMCP framework.

### Key Components

**Entry Point**: `src/index.ts`
- Initializes FastMCP server
- Requires `LASTFM_API_KEY` environment variable
- Sets up tools and starts stdio transport

**Last.fm API Client**: `src/client/lastfm.ts`
- Handles all Last.fm API interactions
- Provides methods for user data, tracks, artists, search, and comparisons
- Built-in error handling and JSON parsing

**MCP Tools**: `src/tools/index.ts`
- Exposes 11 tools via MCP protocol:
  - `search_music` - Search tracks/artists
  - `get_user_stats` - Comprehensive user statistics
  - `get_recent_tracks`, `get_now_playing` - Current listening data
  - `get_track_info`, `get_artist_info` - Detailed music metadata
  - `compare_users` - Musical compatibility analysis
  - `get_top_artists`, `get_top_tracks`, `get_loved_tracks` - User preferences
  - `get_recommendations` - Music suggestions based on taste

**Type Definitions**: `src/types/lastfm.ts`
- Complete TypeScript interfaces for Last.fm API responses
- Covers User, Track, Artist, Album entities and their response wrappers

### Time Periods
All tools that accept time periods support: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`

### Environment Setup
- Requires Node.js 18+
- Set `LASTFM_API_KEY` environment variable before running
- Get API key from https://www.last.fm/api

### MCP Server Usage
Designed to work with Claude Desktop or other MCP-compatible clients. The server provides music data access and analysis capabilities through the MCP protocol.