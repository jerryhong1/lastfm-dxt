export interface LastFmUser {
  name: string;
  realname?: string;
  url: string;
  image: Array<{
    size: string;
    "#text": string;
  }>;
  country?: string;
  age?: string;
  playcount: string;
  registered: {
    unixtime: string;
    "#text": string;
  };
}

export interface LastFmTrack {
  name: string;
  artist: {
    "#text": string;
    mbid?: string;
  };
  album?: {
    "#text": string;
    mbid?: string;
  };
  url: string;
  mbid?: string;
  date?: {
    uts: string;
    "#text": string;
  };
  "@attr"?: {
    nowplaying?: string;
  };
  image: Array<{
    size: string;
    "#text": string;
  }>;
}

export interface LastFmArtist {
  name: string;
  mbid?: string;
  url: string;
  image: Array<{
    size: string;
    "#text": string;
  }>;
  playcount?: string;
  listeners?: string;
  bio?: {
    summary: string;
    content: string;
  };
  tags?: {
    tag: Array<{
      name: string;
      url: string;
    }>;
  };
  similar?: {
    artist: LastFmArtist[];
  };
}

export interface LastFmAlbum {
  name: string;
  artist: string;
  mbid?: string;
  url: string;
  image: Array<{
    size: string;
    "#text": string;
  }>;
  playcount?: string;
  listeners?: string;
  tracks?: {
    track: Array<{
      name: string;
      duration: string;
      "@attr": {
        rank: string;
      };
    }>;
  };
}

export interface RecentTracksResponse {
  recenttracks: {
    track: LastFmTrack[];
    "@attr": {
      user: string;
      totalPages: string;
      page: string;
      total: string;
      perPage: string;
    };
  };
}

export interface UserInfoResponse {
  user: LastFmUser;
}

export interface TopArtistsResponse {
  topartists: {
    artist: LastFmArtist[];
    "@attr": {
      user: string;
      totalPages: string;
      page: string;
      total: string;
      perPage: string;
    };
  };
}

export interface TopTracksResponse {
  toptracks: {
    track: LastFmTrack[];
    "@attr": {
      user: string;
      totalPages: string;
      page: string;
      total: string;
      perPage: string;
    };
  };
}

export interface LovedTracksResponse {
  lovedtracks: {
    track: LastFmTrack[];
    "@attr": {
      user: string;
      totalPages: string;
      page: string;
      total: string;
      perPage: string;
    };
  };
}