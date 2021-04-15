const ytsr = require('ytsr');
const fetch = require('node-fetch');
const database = require('./database');
let headers = database.get('spotify_headers');
if (!headers) {
    fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player')
        .then(res => res.json())
        .then(json => {
            headers = {'Authorization': 'Bearer ' + json['accessToken']};
            database.set('spotify_headers', headers);
        })
        .catch(console.log);
}

/**
 *
 * Can be used like:
 * const sfdl = require('./path/to/sfdl');
 * const {song, songs} = await sfdl.get(msg, url);
 * if (song) {
 *  // One song
 * } else {
 *  // Array of songs
 * }
 *
 * @param {*} msg
 * @param {*} url
 * @returns {song | songs}
 */
async function get(msg, url) {
    if (url) {
        const playlist_id = url.split('/playlist/')[1];
        const song_id = url.split('/track/')[1];
        if (playlist_id) {
            const offset = 0;
            const limit = 100;

            // get 'limit' tracks and parse it
            const result = await (await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?offset=${offset}&limit=${limit}`,
                {headers},
            )).json();

            const tracks = (result.tracks || result).items;
            const songs = [];
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i].track;
                const song = await searchYT(track.artists[0].name + ' ' + track.name);
                if (!song) {
                    await msg.channel.send('Could not find a youtube equivalent of ' + track.name);
                } else {
                    songs.push(song);
                }
            }
            return {songs};
        } else if (song_id) {
            const track = await (await fetch(`https://api.spotify.com/v1/tracks/${song_id}/`,
                {headers},
            )).json();

            let song = await searchYT(track.artists[0].name + ' ' + track.name);
            if (!song) {
                await msg.channel.send('Could not find a youtube equivalent of ' + track.name);
            }
            return {song};
        } else {
            throw Error('Could not find any songs from this url');
        }
    } else {
        throw Error('Url should not be empty');
    }
}

async function searchYT(query) {
    const filters1 = await ytsr.getFilters(query);
    const filter1 = filters1.get('Type').get('Video');
    if (filter1.url) {
        const [result] = (await ytsr(filter1.url, {limit: 5})).items.filter(song => !song.title.toLowerCase().includes('album'));
        if (result) {
            return {
                title: result.title,
                url: result.url,
                isLive: result.isLive,
                duration: result.duration || '',
                durationSeconds: timeToSeconds(result.duration),
                thumbnail: result.bestThumbnail.url
            };
        }
    }
}

function timeToSeconds(time) {
    if (!time || time === '') return 0;
    const split = time.split(':');
    let hours = 0;
    let minutes;
    let seconds;
    if (split.length === 3) {
        const [h, m, s] = split;
        hours = +h;
        minutes = +m;
        seconds = +s;
    } else {
        const [m, s] = split;
        minutes = +m;
        seconds = +s;
    }
    return (hours * 3600) + (minutes * 60) + seconds;
}

module.exports = {
    get,
    searchYT
}