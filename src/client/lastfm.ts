import {
  LastFmUser,
  LastFmTrack,
  LastFmArtist,
  LastFmAlbum,
  RecentTracksResponse,
  UserInfoResponse,
  TopArtistsResponse,
  TopTracksResponse,
  LovedTracksResponse,
} from "../types/lastfm.js";

export class LastFmClient {
  private readonly baseUrl = "https://ws.audioscrobbler.com/2.0/";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("format", "json");
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  }

  async getUserInfo(username: string): Promise<LastFmUser> {
    const response = await this.makeRequest<UserInfoResponse>({
      method: "user.getinfo",
      user: username,
    });
    return response.user;
  }

  async getRecentTracks(username: string, limit = 50, page = 1): Promise<LastFmTrack[]> {
    const response = await this.makeRequest<RecentTracksResponse>({
      method: "user.getrecenttracks",
      user: username,
      limit: limit.toString(),
      page: page.toString(),
    });
    return response.recenttracks.track;
  }

  async getNowPlaying(username: string): Promise<LastFmTrack | null> {
    const tracks = await this.getRecentTracks(username, 1);
    const firstTrack = tracks[0];
    
    if (firstTrack && firstTrack["@attr"]?.nowplaying) {
      return firstTrack;
    }
    
    return null;
  }

  async getTopArtists(username: string, period: "overall" | "7day" | "1month" | "3month" | "6month" | "12month" = "overall", limit = 50): Promise<LastFmArtist[]> {
    const response = await this.makeRequest<TopArtistsResponse>({
      method: "user.gettopartists",
      user: username,
      period,
      limit: limit.toString(),
    });
    return response.topartists.artist;
  }

  async getTopTracks(username: string, period: "overall" | "7day" | "1month" | "3month" | "6month" | "12month" = "overall", limit = 50): Promise<LastFmTrack[]> {
    const response = await this.makeRequest<TopTracksResponse>({
      method: "user.gettoptracks",
      user: username,
      period,
      limit: limit.toString(),
    });
    return response.toptracks.track;
  }

  async getLovedTracks(username: string, limit = 50, page = 1): Promise<LastFmTrack[]> {
    const response = await this.makeRequest<LovedTracksResponse>({
      method: "user.getlovedtracks",
      user: username,
      limit: limit.toString(),
      page: page.toString(),
    });
    return response.lovedtracks.track;
  }

  async searchTracks(query: string, limit = 30): Promise<LastFmTrack[]> {
    const response = await this.makeRequest<{ results: { trackmatches: { track: LastFmTrack[] } } }>({
      method: "track.search",
      track: query,
      limit: limit.toString(),
    });
    return response.results.trackmatches.track;
  }

  async searchArtists(query: string, limit = 30): Promise<LastFmArtist[]> {
    const response = await this.makeRequest<{ results: { artistmatches: { artist: LastFmArtist[] } } }>({
      method: "artist.search",
      artist: query,
      limit: limit.toString(),
    });
    return response.results.artistmatches.artist;
  }

  async getArtistInfo(artist: string): Promise<LastFmArtist> {
    const response = await this.makeRequest<{ artist: LastFmArtist }>({
      method: "artist.getinfo",
      artist,
    });
    return response.artist;
  }

  async getTrackInfo(artist: string, track: string): Promise<LastFmTrack> {
    const response = await this.makeRequest<{ track: LastFmTrack }>({
      method: "track.getinfo",
      artist,
      track,
    });
    return response.track;
  }

  async compareUsers(user1: string, user2: string): Promise<{ score: string; artists: LastFmArtist[] }> {
    const response = await this.makeRequest<{ 
      comparison: { 
        result: { 
          score: string; 
          artists: { artist: LastFmArtist[] }; 
        } 
      } 
    }>({
      method: "tasteometer.compare",
      type1: "user",
      type2: "user",
      value1: user1,
      value2: user2,
    });
    return {
      score: response.comparison.result.score,
      artists: response.comparison.result.artists.artist,
    };
  }
}