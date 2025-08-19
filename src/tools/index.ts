import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LastFmClient } from "../client/lastfm.js";

// Detail level enum for controlling response verbosity
const DetailLevel = z.enum(["minimal", "standard", "full"]).default("standard");

// Helper function to filter response based on detail level
function filterResponseByDetail(data: any, level: "minimal" | "standard" | "full"): any {
  if (level === "full") return data;
  
  if (Array.isArray(data)) {
    return data.map(item => filterResponseByDetail(item, level));
  }
  
  if (typeof data !== 'object' || data === null) return data;
  
  // For minimal level, only include essential fields
  if (level === "minimal") {
    const minimal: any = {};
    
    // Track-specific fields
    if ('artist' in data && 'name' in data && !('user' in data)) {
      minimal.name = data.name;
      if (typeof data.artist === 'object' && data.artist?.name) {
        minimal.artist = data.artist.name;
      } else if (typeof data.artist === 'string') {
        minimal.artist = data.artist;
      }
      if (data.album) {
        minimal.album = typeof data.album === 'object' ? data.album.name || data.album['#text'] : data.album;
      }
      if (data.playcount) minimal.playcount = parseInt(data.playcount) || data.playcount;
      if (data.date) {
        // Only include the date string, not the full object
        minimal.date = typeof data.date === 'object' ? data.date['#text'] || data.date.uts : data.date;
      }
      if (data['@attr']?.nowplaying) minimal.nowplaying = true;
      return minimal;
    }
    
    // Artist-specific fields
    if ('name' in data && ('listeners' in data || 'playcount' in data) && !('artist' in data)) {
      minimal.name = data.name;
      if (data.playcount) minimal.playcount = parseInt(data.playcount) || data.playcount;
      if (data.listeners) minimal.listeners = parseInt(data.listeners) || data.listeners;
      return minimal;
    }
    
    // User-specific fields
    if ('user' in data || ('name' in data && 'realname' in data)) {
      minimal.username = data.user || data.name;
      if (data.playcount) minimal.playcount = parseInt(data.playcount) || data.playcount;
      if (data.realname) minimal.realname = data.realname;
      if (data.country) minimal.country = data.country;
      if (data.registered) {
        // Just keep the date text, not the full object
        minimal.registered = typeof data.registered === 'object' ? data.registered['#text'] : data.registered;
      }
      return minimal;
    }
    
    // Album-specific fields  
    if ('album' in data || (data.name && data.artist && typeof data.artist === 'string')) {
      minimal.name = data.name;
      if (data.artist) minimal.artist = data.artist;
      if (data.playcount) minimal.playcount = parseInt(data.playcount) || data.playcount;
      return minimal;
    }
    
    // Recursively filter nested objects
    const filtered: any = {};
    for (const key in data) {
      filtered[key] = filterResponseByDetail(data[key], level);
    }
    return filtered;
  }
  
  // For standard level, exclude verbose metadata
  if (level === "standard") {
    const excluded = [
      'mbid', 'url', 'image', 'images', 'streamable', 'ontour', 
      'wiki', 'bio', 'similar', 'tags', 'toptags', 'stats',
      'links', 'duration', 'listeners', 'id', 'userplaycount',
      'userloved', 'match', 'guid', 'bootstrap'
    ];
    const filtered: any = {};
    
    for (const key in data) {
      if (!excluded.includes(key)) {
        // Special handling for some fields
        if (key === 'date' && typeof data[key] === 'object') {
          filtered[key] = data[key]['#text'] || data[key].uts;
        } else if (key === 'registered' && typeof data[key] === 'object') {
          filtered[key] = data[key]['#text'];
        } else if (key === '@attr') {
          // Keep attributes but filter them
          filtered[key] = { ...data[key] };
          delete filtered[key].rank;
        } else {
          filtered[key] = filterResponseByDetail(data[key], level);
        }
      }
    }
    return filtered;
  }
  
  return data;
}

export function setupTools(server: FastMCP, client: LastFmClient, defaultUsername?: string) {
  // Search for music (tracks, artists, albums)
  server.addTool({
    name: "search_music",
    description: "Search for tracks or artists on Last.fm",
    parameters: z.object({
      query: z.string().describe("Search query for music"),
      type: z.enum(["track", "artist"]).describe("Type of search (track or artist)"),
      limit: z.number().default(30).describe("Maximum number of results (default: 30)"),
      detail_level: DetailLevel.describe("Level of detail in response: minimal (just names), standard (no verbose metadata), full (everything)"),
    }),
    execute: async ({ query, type, limit = 30, detail_level = "standard" }) => {
      if (!query) {
        throw new Error("Query is required");
      }

      try {
        let results;
        if (type === "track") {
          results = await client.searchTracks(query, limit);
        } else if (type === "artist") {
          results = await client.searchArtists(query, limit);
        } else {
          throw new Error("Type must be 'track' or 'artist'");
        }

        const filtered = filterResponseByDetail(results, detail_level);
        return JSON.stringify(filtered, null, 2);
      } catch (error) {
        throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get comprehensive user statistics
  server.addTool({
    name: "get_user_stats",
    description: "Get comprehensive listening statistics for a Last.fm user",
    parameters: z.object({
      username: z.string().optional().describe(`Last.fm username${defaultUsername ? ` (default: ${defaultUsername})` : ''}`),
      period: z.enum(["overall", "7day", "1month", "3month", "6month", "12month"])
        .default("overall")
        .describe("Time period for statistics"),
      include_sections: z.array(z.enum(["profile", "nowplaying", "recent", "top_artists", "top_tracks"]))
        .default(["profile", "nowplaying", "top_artists", "top_tracks"])
        .describe("Which sections to include in the stats"),
      top_items_count: z.number().default(10).describe("Number of top artists/tracks to include"),
      detail_level: DetailLevel.describe("Level of detail in response: minimal (just names/counts), standard (no verbose metadata), full (everything)"),
    }),
    execute: async ({ username, period = "overall", include_sections = ["profile", "nowplaying", "top_artists", "top_tracks"], top_items_count = 10, detail_level = "standard" }) => {
      const user = username || defaultUsername;
      if (!user) {
        throw new Error("Username is required (no default username configured)");
      }

      try {
        const stats: any = { period };
        const promises: Promise<any>[] = [];
        const promiseKeys: string[] = [];

        // Only fetch what's requested
        if (include_sections.includes("profile")) {
          promises.push(client.getUserInfo(user));
          promiseKeys.push("user");
        }
        
        if (include_sections.includes("nowplaying")) {
          promises.push(client.getNowPlaying(user));
          promiseKeys.push("nowPlaying");
        }
        
        if (include_sections.includes("top_artists")) {
          promises.push(client.getTopArtists(user, period as any, top_items_count));
          promiseKeys.push("topArtists");
        }
        
        if (include_sections.includes("top_tracks")) {
          promises.push(client.getTopTracks(user, period as any, top_items_count));
          promiseKeys.push("topTracks");
        }
        
        if (include_sections.includes("recent")) {
          promises.push(client.getRecentTracks(user, Math.min(top_items_count, 20)));
          promiseKeys.push("recentTracks");
        }

        const results = await Promise.all(promises);
        
        // Map results to their keys
        promiseKeys.forEach((key, index) => {
          stats[key] = results[index];
        });

        const filtered = filterResponseByDetail(stats, detail_level);
        return JSON.stringify(filtered, null, 2);
      } catch (error) {
        throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get user's recent tracks
  server.addTool({
    name: "get_recent_tracks",
    description: "Get recent tracks for a Last.fm user, optionally filtered by time range",
    parameters: z.object({
      username: z.string().optional().describe(`Last.fm username${defaultUsername ? ` (default: ${defaultUsername})` : ''}`),
      limit: z.number().default(50).describe("Maximum number of tracks to return"),
      time_range: z.enum(["all", "today", "week", "month", "custom"]).default("all").describe("Preset time range for recent tracks"),
      custom_hours: z.number().optional().describe("For custom time_range: number of hours to look back (e.g., 3 for last 3 hours)"),
      from_date: z.string().optional().describe("For custom time_range: ISO date string for start time (e.g., '2024-01-15T10:00:00Z')"),
      to_date: z.string().optional().describe("For custom time_range: ISO date string for end time (e.g., '2024-01-16T10:00:00Z')"),
      detail_level: DetailLevel.describe("Level of detail in response: minimal (just track/artist names), standard (no verbose metadata), full (everything)"),
    }),
    execute: async ({ username, limit = 50, time_range = "all", custom_hours, from_date, to_date, detail_level = "standard" }) => {
      const user = username || defaultUsername;
      if (!user) {
        throw new Error("Username is required (no default username configured)");
      }

      try {
        // Calculate time range timestamps
        let from: number | undefined;
        let to: number | undefined;
        const now = Math.floor(Date.now() / 1000);
        
        switch (time_range) {
          case "today":
            from = now - 86400; // 24 hours
            break;
          case "week":
            from = now - 604800; // 7 days
            break;
          case "month":
            from = now - 2592000; // 30 days
            break;
          case "custom":
            if (custom_hours) {
              // Relative time: last N hours
              from = now - (custom_hours * 3600);
            } else if (from_date || to_date) {
              // Absolute date range
              if (from_date) {
                from = Math.floor(new Date(from_date).getTime() / 1000);
              }
              if (to_date) {
                to = Math.floor(new Date(to_date).getTime() / 1000);
              }
            } else {
              throw new Error("Custom time range requires either custom_hours or from_date/to_date");
            }
            break;
          case "all":
          default:
            // No time filter
            break;
        }

        const tracks = await client.getRecentTracks(user, limit, 1, from, to);
        const filtered = filterResponseByDetail(tracks, detail_level);
        return JSON.stringify(filtered, null, 2);
      } catch (error) {
        throw new Error(`Failed to get recent tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get what user is currently playing
  server.addTool({
    name: "get_now_playing",
    description: "Get the currently playing track for a Last.fm user",
    parameters: z.object({
      username: z.string().optional().describe(`Last.fm username${defaultUsername ? ` (default: ${defaultUsername})` : ''}`),
    }),
    execute: async ({ username }) => {
      const user = username || defaultUsername;
      if (!user) {
        throw new Error("Username is required (no default username configured)");
      }

      try {
        const nowPlaying = await client.getNowPlaying(user);
        if (!nowPlaying) {
          return JSON.stringify({ message: "No track currently playing" });
        }
        return JSON.stringify(nowPlaying, null, 2);
      } catch (error) {
        throw new Error(`Failed to get now playing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get detailed track information
  server.addTool({
    name: "get_track_info",
    description: "Get detailed information about a specific track",
    parameters: z.object({
      artist: z.string().describe("Artist name"),
      track: z.string().describe("Track name"),
      username: z.string().optional().describe("Username for personalized data (play count, loved status)"),
      detail_level: DetailLevel.describe("Level of detail in response: minimal, standard, or full"),
    }),
    execute: async ({ artist, track, username, detail_level = "standard" }) => {
      if (!artist || !track) {
        throw new Error("Artist and track names are required");
      }

      try {
        const trackInfo = await client.getTrackInfo(artist, track);
        const filtered = filterResponseByDetail(trackInfo, detail_level);
        return JSON.stringify(filtered, null, 2);
      } catch (error) {
        throw new Error(`Failed to get track info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get detailed artist information
  server.addTool({
    name: "get_artist_info",
    description: "Get detailed information about an artist",
    parameters: z.object({
      artist: z.string().describe("Artist name"),
      username: z.string().optional().describe("Username for personalized data (play count)"),
      detail_level: DetailLevel.describe("Level of detail in response: minimal, standard, or full"),
    }),
    execute: async ({ artist, username, detail_level = "standard" }) => {
      if (!artist) {
        throw new Error("Artist name is required");
      }

      try {
        const artistInfo = await client.getArtistInfo(artist);
        const filtered = filterResponseByDetail(artistInfo, detail_level);
        return JSON.stringify(filtered, null, 2);
      } catch (error) {
        throw new Error(`Failed to get artist info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // TODO: Implement custom user comparison
  // - Get top artists for both users
  // - Calculate similarity score based on overlap
  // - Find common favorites and unique discoveries
  // - Return compatibility rating like Last.fm's old Taste-o-Meter

  // Get user's top artists
  server.addTool({
    name: "get_top_artists",
    description: "Get a user's top artists for a specific time period",
    parameters: z.object({
      username: z.string().optional().describe(`Last.fm username${defaultUsername ? ` (default: ${defaultUsername})` : ''}`),
      period: z.enum(["overall", "7day", "1month", "3month", "6month", "12month"])
        .default("overall")
        .describe("Time period for top artists"),
      limit: z.number().default(50).describe("Maximum number of artists to return"),
      detail_level: DetailLevel.describe("Level of detail in response: minimal (just names/counts), standard, or full"),
    }),
    execute: async ({ username, period = "overall", limit = 50, detail_level = "standard" }) => {
      const user = username || defaultUsername;
      if (!user) {
        throw new Error("Username is required (no default username configured)");
      }

      try {
        const topArtists = await client.getTopArtists(user, period as any, limit);
        const filtered = filterResponseByDetail(topArtists, detail_level);
        return JSON.stringify(filtered, null, 2);
      } catch (error) {
        throw new Error(`Failed to get top artists: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get user's top tracks
  server.addTool({
    name: "get_top_tracks",
    description: "Get a user's top tracks for a specific time period",
    parameters: z.object({
      username: z.string().optional().describe(`Last.fm username${defaultUsername ? ` (default: ${defaultUsername})` : ''}`),
      period: z.enum(["overall", "7day", "1month", "3month", "6month", "12month"])
        .default("overall")
        .describe("Time period for top tracks"),
      limit: z.number().default(50).describe("Maximum number of tracks to return"),
      detail_level: DetailLevel.describe("Level of detail in response: minimal (just track/artist names), standard, or full"),
    }),
    execute: async ({ username, period = "overall", limit = 50, detail_level = "standard" }) => {
      const user = username || defaultUsername;
      if (!user) {
        throw new Error("Username is required (no default username configured)");
      }

      try {
        const topTracks = await client.getTopTracks(user, period as any, limit);
        const filtered = filterResponseByDetail(topTracks, detail_level);
        return JSON.stringify(filtered, null, 2);
      } catch (error) {
        throw new Error(`Failed to get top tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get user's loved tracks
  server.addTool({
    name: "get_loved_tracks",
    description: "Get a user's loved/favorited tracks",
    parameters: z.object({
      username: z.string().optional().describe(`Last.fm username${defaultUsername ? ` (default: ${defaultUsername})` : ''}`),
      limit: z.number().default(50).describe("Maximum number of tracks to return"),
      detail_level: DetailLevel.describe("Level of detail in response: minimal, standard, or full"),
    }),
    execute: async ({ username, limit = 50, detail_level = "standard" }) => {
      const user = username || defaultUsername;
      if (!user) {
        throw new Error("Username is required (no default username configured)");
      }

      try {
        const lovedTracks = await client.getLovedTracks(user, limit);
        const filtered = filterResponseByDetail(lovedTracks, detail_level);
        return JSON.stringify(filtered, null, 2);
      } catch (error) {
        throw new Error(`Failed to get loved tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // TODO: Implement custom recommendations
  // Ideas:
  // - Use artist.getSimilar API (if available) for user's top artists
  // - Analyze tags/genres from user's favorites
  // - Find artists with similar tags they haven't listened to
  // - Could also look at friends' listening habits (if API allows)
}