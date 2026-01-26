export interface LastFmImage {
    '#text': string;
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega' | '';
}

export interface LastFmArtist {
    name: string;
    mbid?: string;
    url?: string;
}

export interface LastFmTrack {
    name: string;
    duration?: string;
    playcount?: string;
    listeners?: string;
    mbid?: string;
    url?: string;
    streamable?: {
        '#text': string;
        fulltrack: string;
    };
    artist: LastFmArtist | string; // API sometimes returns object, sometimes string
    image?: LastFmImage[];
    album?: {
        title: string;
        image?: LastFmImage[];
    };
    toptags?: {
        tag: { name: string; url: string }[];
    };
    wiki?: {
        summary: string;
        content: string;
    };
    '@attr'?: {
        rank: string;
    };
}

export interface EnrichedTrack extends Omit<LastFmTrack, 'image' | 'artist'> {
    artist: string;
    image: string; // Flattened image URL
    price: number;
    volume: number;
    change24h: string;
    isPositive: boolean;
}
