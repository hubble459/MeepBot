// noinspection JSUnusedGlobalSymbols

const {getGetString} = require('../utils/strings');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const sfdl = require('../utils/sfdl');
const scdl = require('soundcloud-downloader').default;
const client = require('../utils/client');
const {MessageEmbed} = require('discord.js');
const database = require('../utils/database');
const connections = {};

client.on('voiceStateUpdate', (oldMember, newMember) => {
    if (oldMember.channel && !newMember.channel) {
        if (oldMember.id === client.user.id) {
            const connection = connections[oldMember.guild.id];
            if (connection) {
                connection.disconnect();
            }
            console.log('[VC] Left');
        }
    } else if (!oldMember.channel && newMember.channel) {
        if (newMember.id === client.user.id) {
            console.log('[VC] Joined');
        }
    }
});

function shouldPlay(connection) {
    return !connection.dispatcher;
}

function updateDatabase(queue, guildId) {
    database.set(guildId, queue, 'music.queue');
}

function secondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600).toString();
    const minutes = Math.floor(seconds / 60 % 60).toString();
    const seconds2 = Math.max(0, seconds % 60 - 1).toString();
    return (hours === '0' ? '' : hours.padStart(2, '0') + ':') + minutes.padStart(2, '0') + ':' + seconds2.padStart(2, '0');
}

function msToSeconds(ms) {
    return Math.floor(Math.max(0, ms / 1000));
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

function filter(reaction, user) {
    return ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot;
}

function replaceAt(string, index, replacement) {
    return string.slice(0, index) + replacement + string.slice(index + replacement.length);
}

async function nextSong(guildId, queue) {
    if (queue.songs.length !== 0) {
        const connection = connections[guildId];
        const volume = database.get(guildId,'music.volume') / 100;

        const song = queue.songs[0];
        const options = {
            seek: song.seek,
            volume: volume,
        };
        if (song.url.startsWith('https://soundcloud.com')) {
            connection.play(await scdl.download(song.url), options);
        } else {
            const readable = ytdl(song.url, {
                filter: 'audioonly',
                highWaterMark: 1024 * 1024 * 10
            });
            connection.play(readable, options);
        }
        song.pauseTime = -((song.seek * 1000) || 0);

        connection.dispatcher.on('finish', () => {
            const q = database.get(guildId, 'music.queue');
            switch (q.repeat) {
                case 0:
                    q.songs.shift();
                    break;
                case 1:
                    q.songs.push(q.songs.shift());
                    break;
            }
            updateDatabase(q, guildId);
            nextSong(guildId, q);
        });
        connection.dispatcher.on('error', (e) => {
            connection.dispatcher.destroy();
            console.log('play error', e);
        });
        updateDatabase(queue, guildId);
    }
}

async function addSong(msg, queue, connection, song) {
    const getString = getGetString(msg.guild.id);

    if (queue.songs.length !== 0) {
        await msg.channel.send(getString('music_added_to_queue').format(song.title));
    }
    queue.songs.push(song);

    if (shouldPlay(connection)) {
        await nextSong(msg.guild.id, queue);
        await msg.channel.send(getString('music_now_playing').format(queue.songs[0].title));
    }
}

async function play(msg, args = ['']) {
    const getString = getGetString(msg.guild.id);

    const tmp = [];
    args.forEach(a => tmp.push(...a.split('\n')));
    args = tmp;

    if (!msg.member.voice.channel) {
        await msg.channel.send(getString('play_join_vc'));
    } else {
        // Get queue
        const queue = database.get(msg.guild.id, 'music.queue');

        // Join if not already joined
        let connection = connections[msg.guild.id] || msg.guild.voice ? msg.guild.connection : undefined;
        if (!connection) {
            connection = await msg.member.voice.channel.join();
        }
        connections[msg.guild.id] = connection;

        // Play song
        const url = args[0];
        if (url) {
            if (url.startsWith('https://open.spotify.com/')) {
                try {
                    const errors = [];
                    let errCount = 0;
                    let progress;
                    let last = Date.now();
                    let avg = 0;
                    const onProgress = async (at, from) => {
                        let songAvg = 1;
                        if (at !== 0) {
                            const time = Date.now() - last;
                            avg += time;
                            songAvg = 1000 / (avg / at);
                        }
                        last = Date.now();
                        let eta = (from - at) / songAvg;
                        let type;
                        if (eta >= 60) {
                            eta /= 60;
                            type = getString('play_minute');
                        } else {
                            type = getString('play_second');
                        }

                        const embed = new MessageEmbed()
                            .setTitle(getString('play_progress'))
                            .setColor('#bfff00')
                            .setDescription(
                                getString('play_progress_desc')
                                    .format(
                                        at,
                                        from,
                                        (100 / from * at).toFixed(2), // percent
                                        songAvg.toFixed(2), // song p/s
                                        songAvg !== 1 ? 's' : '', // plural
                                        eta.toFixed(2), // eta
                                        type, // type
                                        eta !== 1 ? 's' : '', // type plural
                                    )
                            );
                        if (errors.length > 0) {
                            embed.addField(
                                getString('play_progress_not_found_name').format(errCount),
                                getString('play_progress_not_found_value').format(errors.join('\n'))
                            );
                        }
                        if (!progress) {
                            progress = await msg.channel.send(embed);
                        } else {
                            await progress.edit(embed);
                        }
                    };

                    const onTrackNotFound = (track) => {
                        errors.push('-' + track.name);
                        errCount++;
                        if (errors.length > 10) {
                            errors.shift();
                        }
                    };

                    const {songs, song} = await sfdl.get(url, onTrackNotFound, onProgress);
                    if (progress) {
                        await progress.delete();
                    }
                    const sp = shouldPlay(connection);

                    if (songs) {
                        queue.songs.push(...songs);
                        await msg.channel.send(getString('play_added_items_to_queue').format(songs.length));
                    } else if (song) {
                        if (queue.songs.length !== 0) {
                            await msg.channel.send(getString('music_added_to_queue').format(song.title));
                        }
                        queue.songs.push(song);
                    }

                    if (sp) {
                        await nextSong(msg.guild.id, queue);
                        await msg.channel.send(getString('music_now_playing').format(queue.songs[0].title));
                    }
                } catch (err) {
                    console.log(err);
                    await msg.channel.send(err.message);
                }
            } else if (url.startsWith('https://soundcloud.com')) {
                try {
                    const info = await scdl.getInfo(url);
                    const song = {
                        title: info.title,
                        url: info.permalink_url,
                        duration: secondsToTime(Math.round(info.full_duration / 1000)),
                        durationSeconds: Math.round(info.full_duration / 1000),
                        thumbnail: info.artwork_url
                    };

                    await addSong(msg, queue, connection, song);
                } catch (err) {
                    await msg.channel.send(err.message);
                }
            } else if (url.match(/^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/)) {
                const playlist = await ytpl(url);
                const songs = playlist.items.map(({title, url, isLive, duration, bestThumbnail}) => {
                    return {
                        title,
                        url,
                        isLive,
                        duration,
                        durationSeconds: timeToSeconds(duration),
                        thumbnail: bestThumbnail.url
                    };
                });
                queue.songs.push(...songs);
                await msg.channel.send(getString('play_added_items_to_queue').format(songs.length));
                if (shouldPlay(connection)) {
                    await nextSong(msg.guild.id, queue);
                    await msg.channel.send(getString('music_now_playing').format(queue.songs[0].title));
                }
            } else if (url.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/)) {
                if (url.includes('list=')) {
                    await msg.channel.send(getString('play_youtube_mix'));
                }

                const info = await ytdl.getInfo(url);
                const song = {
                    title: info.videoDetails.title,
                    url: info.videoDetails.video_url,
                    isLive: info.videoDetails.isLiveContent,
                    duration: secondsToTime(info.videoDetails.lengthSeconds),
                    durationSeconds: info.videoDetails.lengthSeconds,
                    thumbnail: info.videoDetails.thumbnails[0].url
                };

                if (queue.songs.length !== 0) {
                    await msg.channel.send(getString('music_added_to_queue').format(song.title));
                }

                queue.songs.push(song);

                if (shouldPlay(connection)) {
                    await nextSong(msg.guild.id, queue);
                    await msg.channel.send(getString('music_now_playing').format(queue.songs[0].title));
                } else {
                }
            } else if (/^https?:\/\/(www)?.*/.test(url)) {
                return msg.channel.send(getString('play_unsupported'));
            } else {
                const song = await sfdl.searchYT(args.join(' '));
                if (song) {
                    await addSong(msg, queue, connection, song);
                } else {
                    await msg.channel.send(getString('play_no_results'));
                }
                return;
            }
        } else if (queue.songs.length !== 0) {
            await nextSong(msg.guild.id, queue);
        } else {
            await msg.channel.send(
                new MessageEmbed()
                    .setDescription(getString('music_empty_queue'))
            );
        }

        if (/^https?:\/\/(www)?.*/.test(url)) {
            args.shift();
            const next = args[0];
            if (/^https?:\/\/(www)?.*/.test(next)) {
                await play(msg, args);
            }
        }
    }
}

async function stop(msg) {
    const getString = getGetString(msg.guild.id);
    const connection = connections[msg.guild.id];
    if (connection) {
        const queue = database.get(msg.guild.id, 'music.queue');
        const song = queue.songs[0];
        if (connection.dispatcher && !connection.dispatcher.paused && song) {
            const pauseTime = connection.dispatcher.paused ? Date.now() - connection.dispatcher.pausedSince + song.pauseTime : song.pauseTime;
            song.seek = msToSeconds(Date.now() - connection.dispatcher.startTime - pauseTime);
            updateDatabase(queue, msg.guild.id);
        }
        connection.disconnect();
        delete connections[msg.guild.id];
        await msg.channel.send(getString('stop_disconnected'));
    } else {
        await msg.channel.send(getString('stop_not_connected'));
    }
}

async function skip(msg, [to]) {
    const getString = getGetString(msg.guild.id);
    const queue = database.get(msg.guild.id, 'music.queue');
    const connection = connections[msg.guild.id];

    if (connection && connection.dispatcher) {
        if (to) {
            to = +to;
            if (isNaN(to)) {
                return msg.channel.send(getString('skip_not_a_number'));
            }
        } else {
            to = 1;
        }
        connection.dispatcher.destroy();

        const song = to === 1 ? queue.songs[0].title : `${to} songs`;
        let next = queue.songs[to];
        if (next) {
            next = next.title;
        } else {
            next = 'nothing';
        }
        await msg.channel.send(getString('skip_notify').format(song, next));

        queue.songs = queue.songs.slice(to);
        await nextSong(msg.guild.id, queue);
    } else {
        await msg.channel.send(getString('skip_nothing'));
    }
}

async function pause(msg) {
    const getString = getGetString(msg.guild.id);
    const connection = connections[msg.guild.id];
    const queue = database.get(msg.guild.id, 'music.queue');
    if (queue.songs.length !== 0 && connection && connection.dispatcher) {
        if (!connection.dispatcher.paused) {
            const song = queue.songs[0];
            if (song) {
                const pauseTime = connection.dispatcher.paused ? Date.now() - connection.dispatcher.pausedSince + song.pauseTime : song.pauseTime;
                song.seek = msToSeconds(Date.now() - connection.dispatcher.startTime - pauseTime);
                updateDatabase(queue, msg.guild.id);
            }

            connection.dispatcher.pause(true);
            await msg.channel.send(getString('pause_paused'));
        } else {
            await msg.channel.send(getString('pause_already_paused'));
        }
    } else {
        await msg.channel.send(getString('pause_no_songs'));
    }
}

async function resume(msg) {
    const getString = getGetString(msg.guild.id);
    const connection = connections[msg.guild.id];
    const queue = database.get(msg.guild.id, 'music.queue');
    if (queue.songs.length !== 0) {
        if (!connection || !connection.dispatcher) {
            await play(msg, []);
        } else if (connection.dispatcher.paused) {
            const song = queue.songs[0];
            song.pauseTime += Math.abs(Date.now() - connection.dispatcher.pausedSince);
            connection.dispatcher.resume();
            await msg.channel.send(getString('resume_resuming'));
        } else {
            await msg.channel.send(getString('resume_not_paused'));
        }
    } else {
        await msg.channel.send(getString('resume_no_queue'));
    }
}

async function queue(msg) {
    const getString = getGetString(msg.guild.id);

    const queue = database.get(msg.guild.id, 'music.queue');
    if (queue.songs.length !== 0) {
        const perPage = 20;
        const pages = queue.songs.length / perPage;
        let page = 0;

        let duration = 1;
        queue.songs.forEach(s => duration += s.durationSeconds);

        const totalString = getString('queue_total');
        const durationString = getString('queue_duration').format(secondsToTime(duration));

        let navigating = true;
        let send = true;
        while (navigating) {
            let prettyQueue = '```haskell\n';
            prettyQueue += totalString.format(queue.songs.length) + '\n';
            prettyQueue += durationString + '\n\n';
            let i = 0;
            const songs = queue.songs.slice(page * perPage, (page + 1) * perPage);
            for (const song of songs) {
                prettyQueue += `${(i++ + 1) + (page * perPage)}) ${song.duration} ${song.title}\n`;
            }
            prettyQueue += '```';

            if (send) {
                send = false;
                msg = await msg.channel.send(prettyQueue);
            } else {
                await msg.edit(prettyQueue);
                await msg.reactions.removeAll();
            }
            if (page !== 0) await msg.react('⬅️');
            if (page < pages - 1) await msg.react('➡️');
            try {
                const collected = await msg.awaitReactions(filter, {max: 1, time: 300000, errors: ['time']});
                const reaction = collected.first();
                if (reaction.emoji.name === '➡️') {
                    ++page;
                } else {
                    --page;
                }
            } catch (err) {
                await msg.reactions.removeAll();
                navigating = false;
            }
        }
    } else {
        const embed = new MessageEmbed()
            .setDescription(getString('music_empty_queue'));
        await msg.channel.send(embed);
    }
}

async function remove(msg, [item], log = true) {
    const getString = getGetString(msg.guild.id);
    if (item) {
        const connection = connections[msg.guild.id];
        const queue = database.get(msg.guild.id, 'music.queue');
        if (queue.songs.length > 0) {
            if (item === 'all') {
                queue.songs = [];
                if (connection && connection.dispatcher) {
                    connection.dispatcher.destroy();
                }
                updateDatabase(queue, msg.guild.id);
                if (log) {
                    await msg.channel.send(getString('remove_cleared'));
                }
            } else if (!isNaN(+item)) {
                item = +item - 1;
                if (item < 0 || item > queue.songs.length) {
                    await msg.channel.send(getString('remove_invalid_id'));
                } else {
                    let deleted;
                    if (item === 0) {
                        deleted = [{...queue.songs[0]}];
                        if (queue.songs.length > 1) {
                            await skip(msg);
                        } else {
                            connection.dispatcher.destroy();
                            queue.songs = [];
                        }
                    } else {
                        deleted = queue.songs.splice(item, 1);
                    }
                    await msg.channel.send(getString('remove_song').format(deleted[0].title));
                    updateDatabase(queue, msg.guild.id);
                }
            } else {
                await msg.channel.send(getString('remove_invalid_id'));
            }
        } else if (log) {
            const embed = new MessageEmbed()
                .setDescription(getString('music_empty_queue'));
            await msg.channel.send(embed);
        }
    } else {
        await msg.channel.send(getString('remove_no_id'));
    }
}

async function clear(msg) {
    await remove(msg, ['all']);
}

async function now(msg) {
    const getString = getGetString(msg.guild.id);

    const connection = connections[msg.guild.id];
    const queue = database.get(msg.guild.id, 'music.queue');
    if (connection && connection.dispatcher) {
        const song = queue.songs[0];

        const pauseTime = connection.dispatcher.paused ? Date.now() - connection.dispatcher.pausedSince + song.pauseTime : song.pauseTime;
        const playSeconds = msToSeconds(Date.now() - connection.dispatcher.startTime - pauseTime);
        const playTime = secondsToTime(playSeconds || 0);
        const length = 20;
        const progress = Math.round(length / 100 * (100 / song.durationSeconds * playSeconds));
        const progressBar = song.isLive ? '' : replaceAt('─'.repeat(length), progress, '⚪');
        const embed = new MessageEmbed()
            .setTitle(song.title)
            .setThumbnail(song.thumbnail)
            .addField(
                connection.dispatcher.paused ? getString('now_paused') : getString('now_playing'),
                `${progressBar}  ${playTime} / ${song.isLive ? getString('now_live') : song.duration}`);
        await msg.channel.send(embed);
    } else {
        await msg.channel.send(getString('now_not_playing'));
    }
}

async function repeat(msg, [what]) {
    const getString = getGetString(msg.guild.id);
    const queue = database.get(msg.guild.id, 'music.queue');
    const options = {
        'disable': 0,
        'queue': 1,
        'song': 2,
    };
    let help = '';
    what = options[what];
    if (what !== undefined) {
        queue.repeat = what;
        updateDatabase(queue, msg.guild.id);
    } else {
        help = getString('repeat_options') + '\n\n';
    }

    switch (queue.repeat) {
        case 0:
            return msg.channel.send(new MessageEmbed().setDescription(help + getString('repeat_disabled')));
        case 1:
            return msg.channel.send(new MessageEmbed().setDescription(help + getString('repeat_queue')));
        case 2:
            return msg.channel.send(new MessageEmbed().setDescription(help + getString('repeat_song')));
    }
}

async function shuffle(msg) {
    const getString = getGetString(msg.guild.id);
    const queue = database.get(msg.guild.id, 'music.queue');
    const first = queue.songs.shift();
    const songs = queue.songs;
    for (let i = 0; i < 1000; i++) {
        const rand1 = Math.floor(Math.random() * songs.length);
        const rand2 = Math.floor(Math.random() * songs.length);
        const tmp = songs[rand1];
        songs[rand1] = songs[rand2];
        songs[rand2] = tmp;
    }
    queue.songs.unshift(first);
    database.set(msg.guild.id, queue, 'music.queue');
    await msg.channel.send(getString('shuffle_shuffled'));
}

async function playlist(msg, [command, ...name]) {
    const getString = getGetString(msg.guild.id);
    const music = database.get(msg.guild.id, 'music');
    if (command && name.length !== 0) {
        name = name.join(' ');
        const playlist = music.playlists[name];
        switch (command) {
            case 'load':
            case 'l':
                if (playlist) {
                    await remove(msg, ['all'], false);
                    database.set(msg.guild.id, playlist, 'music.queue');
                    await msg.channel.send(getString('playlist_load').format(playlist.songs.length, name));
                    await play(msg, []);
                } else {
                    await msg.channel.send(getString('playlist_not_found').format(name));
                }
                break;
            case 'save':
            case 's':
                if (music.queue.songs.length !== 0) {
                    if (playlist) {
                        await msg.channel.send(getString('playlist_exists').format(name));
                    } else {
                        music.queue.songs[0].seek = 0;
                        database.set(msg.guild.id, music.queue, 'music.playlists.' + name);
                        await msg.channel.send(getString('playlist_saved').format(name, music.queue.songs.length));
                    }
                } else {
                    await msg.channel.send(getString('playlist_empty'));
                }
                break;
            case 'rm':
            case 'remove':
                if (playlist) {
                    database.delete(msg.guild.id, `music.playlists.${name}`);
                    await msg.channel.send(getString('playlist_removed').format(name));
                } else {
                    await msg.channel.send(getString('playlist_not_found').format(name));
                }
                break;
        }
    } else {
        const fields = [];
        Object.entries(music.playlists)
            .forEach(([name, list]) => {
                const size = list.songs.length;
                fields.push({name: name, value: `${size} song${size !== 1 ? 's' : ''}`, inline: true});
            });

        const embed = new MessageEmbed()
            .setTitle(getString('playlist_playlists'))
            .addFields(...fields);

        await msg.channel.send(embed);
    }
}

async function volume(msg, [percentage]) {
    const getString = getGetString(msg.guild.id);

    if (percentage) {
        if (!isNaN(percentage) && percentage >= 0 && percentage <= 500) {
            const connection = connections[msg.guild.id];
            database.set(msg.guild.id, percentage, 'music.volume');
            if (connection && connection.dispatcher) {
                connection.dispatcher.setVolume(percentage / 100);
            }
            await msg.channel.send(getString('volume_change').format(percentage));
        } else {
            await msg.channel.send(getString('volume_invalid'));
        }
    } else {
        const volume = database.get(msg.guild.id, 'music.volume');
        await msg.channel.send(getString('volume_current').format(volume));
    }
}

module.exports = {
    'play': {
        'function': play,
        'group': 'music',
        'permissions': 36700160
    },
    'stop': {
        'function': stop,
        'group': 'music',
        'permissions': 36700160
    },
    'skip': {
        'function': skip,
        'group': 'music',
        'permissions': 36700160
    },
    'pause': {
        'function': pause,
        'group': 'music',
        'permissions': 36700160
    },
    'resume': {
        'function': resume,
        'group': 'music',
        'permissions': 36700160
    },
    'queue': {
        'function': queue,
        'group': 'music',
        'permissions': 59456
    },
    'clear': {
        'function': clear,
        'group': 'music',
    },
    'remove': {
        'function': remove,
        'group': 'music',
    },
    'now': {
        'function': now,
        'group': 'music',
    },
    'repeat': {
        'function': repeat,
        'group': 'music',
    },
    'shuffle': {
        'function': shuffle,
        'group': 'music',
    },
    'playlist': {
        'function': playlist,
        'group': 'music',
    },
    'volume': {
        'function': volume,
        'group': 'music',
    },
};

process.on('exit', (code) => {
    if (code === 0) {
        for (const connection of Object.values(connections)) {
            connection.disconnect();
        }
    }

    return console.log(`Exiting with code ${code}`);
});

process.on('SIGINT', () => {
    process.exit();
});