#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { LastFmClient } from "./client/lastfm.js";
import { setupTools } from "./tools/index.js";

const server = new FastMCP({
  name: "Last.fm MCP Server",
  version: "1.0.0",
});

// Initialize Last.fm client
const apiKey = process.env.LASTFM_API_KEY;
if (!apiKey) {
  console.error("LASTFM_API_KEY environment variable is required");
  process.exit(1);
}

const lastfmClient = new LastFmClient(apiKey);

// Setup tools (FastMCP doesn't support resources in the same way)
setupTools(server, lastfmClient);

// Start the server
server.start({
  transportType: "stdio",
});