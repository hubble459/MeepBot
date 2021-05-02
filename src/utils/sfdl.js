const ytsr = require('ytsr');
const fetch = require('node-fetch');
let headers;
let expires;

async function refreshHeaders() {
	try {
		const token = await (await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player')).json();
		headers = {'Authorization': 'Bearer ' + token['accessToken']};
		expires = token['accessTokenExpirationTimestampMs'];
		console.log('Got new spotify token!');
	} catch (e) {
		console.log(e);
	}
}

refreshHeaders().then();

async function get(url, onNotFound, onProgress) {
	if (url) {
		const playlist_id = url.split('/playlist/')[1];
		const song_id = url.split('/track/')[1];
		if (Date.now() >= expires) {
			await refreshHeaders();
		}
		if (playlist_id) {
			const trackList = [];
			let next = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?offset=0&limit=100`;
			while (next) {
				const result = (await (await fetch(next,
					{headers},
				)).json());

				const tracks = (result.tracks || result);
				next = tracks.next;

				trackList.push(...tracks.items);
			}

			const songs = [];
			onProgress(0, trackList.length);
			for (let i = 0; i < trackList.length; i++) {
				const track = trackList[i].track;
				const song = await searchYT(track.artists[0].name + ' ' + track.name, track.duration_ms);
				if (!song) {
					onNotFound(track);
				} else {
					songs.push(song);
				}
				onProgress(i, trackList.length);
			}
			return {songs};
		} else if (song_id) {
			const track = await (await fetch(`https://api.spotify.com/v1/tracks/${song_id}/`,
				{headers},
			)).json();
			const song = await searchYT(track.artists[0].name + ' ' + track.name, track.duration_ms);
			return {song};
		} else {
			throw Error('Could not find any songs from this url');
		}
	} else {
		throw Error('Url should not be empty');
	}
}

async function searchYT(query, expectedDurationMs) {
	const filters1 = await ytsr.getFilters(query);
	const filter1 = filters1.get('Type').get('Video');
	if (filter1.url) {
		const [result] = (await ytsr(filter1.url, {limit: 20})).items.filter(song => {
			const duration = timeToSeconds(song.duration) * 1000;
			return song && song.url && song.title && (!expectedDurationMs || (duration > (expectedDurationMs - 120000) && duration < (expectedDurationMs + 120000)));
		});
		if (result) {
			return {
				title: result.title.replace(/”/g, '"'),
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
};