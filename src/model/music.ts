export enum SongType {
    LOCAL,
    YOUTUBE,
    SPOTIFY,
    SOUNDCLOUD
}

export enum RepeatType {
    NO_REPEAT,
    SONG_REPEAT,
    QUEUE_REPEAT
}

export type Song = {
    title: string;
    url: string;
    type: SongType;
    thumbnail?: string;
    durationMS: number;
    isLive: boolean;
    artist?: string;
    requestor: {
        name: string;
        avatar: string;
        id: string;
    };
};

export type Music = {
    current: number;
    // channelId: string;
    // messageId: string;
    queue: Song[];
    repeat: RepeatType;
};
