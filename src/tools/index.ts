import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LastFmClient } from "../client/lastfm.js";

export function setupTools(server: FastMCP, client: LastFmClient) {
  // Search for music (tracks, artists, albums)
  server.addTool({
    name: "search_music",
    description: "Search for tracks or artists on Last.fm",
    parameters: z.object({
      query: z.string().describe("Search query for music"),
      type: z.enum(["track", "artist"]).describe("Type of search (track or artist)"),
      limit: z.number().default(30).describe("Maximum number of results (default: 30)"),
    }),
    execute: async ({ query, type, limit = 30 }) => {
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

        return JSON.stringify(results, null, 2);
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
      username: z.string().describe("Last.fm username"),
      period: z.enum(["overall", "7day", "1month", "3month", "6month", "12month"])
        .default("overall")
        .describe("Time period for statistics"),
    }),
    execute: async ({ username, period = "overall" }) => {
      if (!username) {
        throw new Error("Username is required");
      }

      try {
        const [userInfo, topArtists, topTracks, recentTracks, nowPlaying] = await Promise.all([
          client.getUserInfo(username),
          client.getTopArtists(username, period as any, 10),
          client.getTopTracks(username, period as any, 10),
          client.getRecentTracks(username, 10),
          client.getNowPlaying(username),
        ]);

        const stats = {
          user: userInfo,
          nowPlaying,
          topArtists,
          topTracks,
          recentTracks,
          period,
        };

        return JSON.stringify(stats, null, 2);
      } catch (error) {
        throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get user's recent tracks
  server.addTool({
    name: "get_recent_tracks",
    description: "Get recent tracks for a Last.fm user",
    parameters: z.object({
      username: z.string().describe("Last.fm username"),
      limit: z.number().default(50).describe("Maximum number of tracks to return"),
    }),
    execute: async ({ username, limit = 50 }) => {
      if (!username) {
        throw new Error("Username is required");
      }

      try {
        const tracks = await client.getRecentTracks(username, limit);
        return JSON.stringify(tracks, null, 2);
      } catch (error) {
        throw new Error(`Failed to get recent tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get what user is currently playing
  server.addTool({
    name: "get_now_playing",
    description: "Get what a Last.fm user is currently listening to",
    parameters: z.object({
      username: z.string().describe("Last.fm username"),
    }),
    execute: async ({ username }) => {
      if (!username) {
        throw new Error("Username is required");
      }

      try {
        const nowPlaying = await client.getNowPlaying(username);
        return nowPlaying ? JSON.stringify(nowPlaying, null, 2) : "No track currently playing";
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
    }),
    execute: async ({ artist, track }) => {
      if (!artist || !track) {
        throw new Error("Both artist and track are required");
      }

      try {
        const trackInfo = await client.getTrackInfo(artist, track);
        return JSON.stringify(trackInfo, null, 2);
      } catch (error) {
        throw new Error(`Failed to get track info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get detailed artist information
  server.addTool({
    name: "get_artist_info",
    description: "Get detailed information about an artist including bio and similar artists",
    parameters: z.object({
      artist: z.string().describe("Artist name"),
    }),
    execute: async ({ artist }) => {
      if (!artist) {
        throw new Error("Artist name is required");
      }

      try {
        const artistInfo = await client.getArtistInfo(artist);
        return JSON.stringify(artistInfo, null, 2);
      } catch (error) {
        throw new Error(`Failed to get artist info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Compare listening habits between two users
  server.addTool({
    name: "compare_users",
    description: "Compare listening habits and musical compatibility between two Last.fm users",
    parameters: z.object({
      user1: z.string().describe("First user's Last.fm username"),
      user2: z.string().describe("Second user's Last.fm username"),
    }),
    execute: async ({ user1, user2 }) => {
      if (!user1 || !user2) {
        throw new Error("Both user1 and user2 are required");
      }

      try {
        const comparison = await client.compareUsers(user1, user2);
        return JSON.stringify(comparison, null, 2);
      } catch (error) {
        throw new Error(`Failed to compare users: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get user's top artists for a period
  server.addTool({
    name: "get_top_artists",
    description: "Get top artists for a Last.fm user over a specific time period",
    parameters: z.object({
      username: z.string().describe("Last.fm username"),
      period: z.enum(["overall", "7day", "1month", "3month", "6month", "12month"])
        .default("overall")
        .describe("Time period for top artists"),
      limit: z.number().default(50).describe("Maximum number of artists to return"),
    }),
    execute: async ({ username, period = "overall", limit = 50 }) => {
      if (!username) {
        throw new Error("Username is required");
      }

      try {
        const artists = await client.getTopArtists(username, period as any, limit);
        return JSON.stringify(artists, null, 2);
      } catch (error) {
        throw new Error(`Failed to get top artists: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get user's top tracks for a period
  server.addTool({
    name: "get_top_tracks",
    description: "Get top tracks for a Last.fm user over a specific time period",
    parameters: z.object({
      username: z.string().describe("Last.fm username"),
      period: z.enum(["overall", "7day", "1month", "3month", "6month", "12month"])
        .default("overall")
        .describe("Time period for top tracks"),
      limit: z.number().default(50).describe("Maximum number of tracks to return"),
    }),
    execute: async ({ username, period = "overall", limit = 50 }) => {
      if (!username) {
        throw new Error("Username is required");
      }

      try {
        const tracks = await client.getTopTracks(username, period as any, limit);
        return JSON.stringify(tracks, null, 2);
      } catch (error) {
        throw new Error(`Failed to get top tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get user's loved tracks
  server.addTool({
    name: "get_loved_tracks",
    description: "Get tracks that a Last.fm user has marked as loved/favorited",
    parameters: z.object({
      username: z.string().describe("Last.fm username"),
      limit: z.number().default(50).describe("Maximum number of loved tracks to return"),
    }),
    execute: async ({ username, limit = 50 }) => {
      if (!username) {
        throw new Error("Username is required");
      }

      try {
        const tracks = await client.getLovedTracks(username, limit);
        return JSON.stringify(tracks, null, 2);
      } catch (error) {
        throw new Error(`Failed to get loved tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  // Get music recommendations based on user's taste
  server.addTool({
    name: "get_recommendations",
    description: "Get music recommendations based on a user's Last.fm listening history",
    parameters: z.object({
      username: z.string().describe("Last.fm username to base recommendations on"),
      type: z.enum(["similar_artists", "top_tags"])
        .default("similar_artists")
        .describe("Type of recommendations"),
    }),
    execute: async ({ username, type = "similar_artists" }) => {
      if (!username) {
        throw new Error("Username is required");
      }

      try {
        const topArtists = await client.getTopArtists(username, "overall", 5);
        
        if (type === "similar_artists") {
          const recommendations = [];
          for (const artist of topArtists.slice(0, 3)) {
            try {
              const artistInfo = await client.getArtistInfo(artist.name);
              if (artistInfo.similar?.artist) {
                recommendations.push({
                  basedOn: artist.name,
                  similar: artistInfo.similar.artist.slice(0, 3),
                });
              }
            } catch (error) {
              // Continue with other artists if one fails
              continue;
            }
          }
          
          return JSON.stringify({ type, recommendations }, null, 2);
        }

        return JSON.stringify({ type, message: "Recommendation type not fully implemented yet" }, null, 2);
      } catch (error) {
        throw new Error(`Failed to get recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });
}