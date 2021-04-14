const {scClientID} = require('../utils/config');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const sfdl = require('../utils/sfdl');
const scdl = require('soundcloud-downloader').default;
const client = require('../utils/client');
const {MessageEmbed} = require('discord.js');
const allQueues = {};

client.on('voiceStateUpdate', (oldMember, newMember) => {
    if (oldMember.channel && !newMember.channel) {
        const queue = allQueues[oldMember.guild.id];
        if (oldMember.id === client.user.id) {
            console.log('[VC] Left');
            if (queue && queue.connection) {
                queue.connection.disconnect();
                queue.connection = undefined;
            }
        }
    } else if (!oldMember.channel && newMember.channel) {
        if (newMember.id === client.user.id) {
            console.log('[VC] Joined');
        }
    }
});

async function play(msg, args) {
    if (!msg.member.voice.channel) {
        await msg.channel.send('Join a voice channel first');
    } else {
        let queue = allQueues[msg.guild.id];
        if (!queue) {
            queue = allQueues[msg.guild.id] = {
                connection: undefined,
                songs: [],
                repeat: 0
            };
        }

        // Join if not already joined
        let connection = msg.guild.voice ? msg.guild.connection : undefined;
        if (!connection) {
            connection = await msg.member.voice.channel.join();
            queue.connection = connection;
        }

        // Play song
        const url = args[0];
        if (url) {
            if (url.startsWith('https://open.spotify.com/')) {
                try {
                    const {songs, song} = await sfdl.get(msg, url);
                    const notPlaying = queue.songs.length === 0;

                    if (songs) {
                        queue.songs.push(...songs);
                        await msg.channel.send(`Added **${songs.length}** items to the queue`);
                    } else if (song) {
                        queue.songs.push(song);
                        if (!notPlaying) {
                            await msg.channel.send(`Added \`${song.title}\` to the queue`)
                        }
                    }

                    if (notPlaying) {
                        await nextSong(queue);
                        await msg.channel.send(`Now playing \`${(song || songs[0]).title}\``);
                    }
                } catch (err) {
                    await msg.channel.send(err.message);
                }
            } else if (url.startsWith('https://soundcloud.com')) {
                try {
                    const info = await scdl.getInfo(url, scClientID);
                    const song = {
                        title: info.title,
                        url: info.permalink_url,
                        duration: secondsToTime(Math.round(info.full_duration / 1000)),
                        durationSeconds: Math.round(info.full_duration / 1000),
                        thumbnail: info.artwork_url
                    };
                    queue.songs.push(song);

                    if (queue.songs.length === 1) {
                        await nextSong(queue);
                        await msg.channel.send(`Now playing \`${song.title}\``);
                    } else {
                        await msg.channel.send(`Added \`${song.title}\` to the queue`)
                    }
                } catch (err) {
                    await msg.channel.send(err.message);
                }
            } else if (url.startsWith('https://www.youtube.com/playlist?list=')) {
                const playlist = await ytpl(url);
                const notPlaying = queue.songs.length === 0;
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
                await msg.channel.send(`Added **${songs.length}** items to the queue`);
                if (notPlaying) {
                    await nextSong(queue);
                    await msg.channel.send(`Now playing \`${songs[0].title}\``);
                }
            } else if (url.startsWith('https://www.youtube.com/watch?v=')) {
                if (url.includes('list=')) {
                    await msg.channel.send('Mixes aren\'t supported');
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
                queue.songs.push(song);
                if (queue.songs.length === 1) {
                    await nextSong(queue);
                    await msg.channel.send(`Now playing \`${song.title}\``);
                } else {
                    await msg.channel.send(`Added \`${song.title}\` to the queue`)
                }
            } else if (/^https?:\/\/(www)?.*/.test(url)) {
                return msg.channel.send(`This platform isn't supported (yet)`);
            } else {
                const song = await sfdl.searchYT(args.join(' '));
                if (song) {
                    queue.songs.push(song);
                    if (queue.songs.length === 1) {
                        await nextSong(queue);
                        await msg.channel.send(`Now playing \`${song.title}\``);
                    } else {
                        await msg.channel.send(`Added \`${song.title}\` to the queue`);
                    }
                } else {
                    await msg.channel.send('No search results');
                }
                return;
            }
        } else if (queue.songs.length !== 0) {
            await nextSong(queue);
        } else {
            await msg.channel.send(new MessageEmbed().setDescription('The queue is `empty`'));
        }

        if (/^https?:\/\/(www)?.*/.test(url)) {
            console.log(args)
            args.shift();
            const next = args[0];
            console.log(next);
            if (/^https?:\/\/(www)?.*/.test(next)) {
                await play(msg, args);
            }
        }
    }
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

async function nextSong(queue) {
    if (queue.songs.length !== 0) {
        let dispatcher;
        if (queue.songs[0].url.startsWith('https://soundcloud.com')) {
            dispatcher = queue.connection.play(await scdl.download(queue.songs[0].url, scClientID));
        } else {
            dispatcher = queue.connection.play(ytdl(queue.songs[0].url));
        }
        queue.songs[0].dispatcher = dispatcher;
        queue.songs[0].pauseTime = 0;
        dispatcher.on('finish', () => {
            switch (queue.repeat) {
                case 0:
                    queue.songs.shift();
                    break;
                case 1:
                    queue.songs.push(queue.songs.shift());
                    break;
            }
            nextSong(queue);
        });
        dispatcher.on('error', console.log);
    }
}

async function stop(msg) {
    const queue = allQueues[msg.guild.id];
    if (queue && queue.connection) {
        queue.connection.disconnect();
        await msg.channel.send('Disconnected');
    } else {
        await msg.channel.send('I\'m not in a voice channel :/');
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

async function skip(msg, args) {
    const queue = allQueues[msg.guild.id];
    if (queue && queue.connection && queue.connection.dispatcher) {
        queue.connection.dispatcher.destroy();
        const to = args ? +args[0] - 1 || 1 : 1;
        queue.songs = queue.songs.slice(to);
        await nextSong(queue);
    } else {
        await msg.channel.send('Nothing to skip');
    }
}

async function pause(msg) {
    const queue = allQueues[msg.guild.id];
    if (queue && queue.songs.length !== 0) {
        if (queue.connection && queue.connection.dispatcher) {
            if (!queue.connection.dispatcher.paused) {
                queue.connection.dispatcher.pause(true);
                await msg.channel.send('Paused')
            } else {
                await msg.channel.send('Already paused!')
            }
        } else {
            await msg.channel.send('Not playing any songs');
        }
    } else {
        await msg.channel.send('No queue');
    }
}

async function resume(msg) {
    const queue = allQueues[msg.guild.id];
    if (queue && queue.songs.length !== 0) {
        if (!queue.connection || !queue.connection.dispatcher) {
            await play(msg, []);
        } else if (queue.connection.dispatcher.paused) {
            const song = queue.songs[0];
            song.pauseTime += Math.abs(Date.now() - song.dispatcher.pausedSince);
            console.log(song.pauseTime);
            queue.connection.dispatcher.resume();
            await msg.channel.send('Resuming...');
        } else {
            await msg.channel.send('Not paused');
        }
    } else {
        await msg.channel.send('No queue');
    }
}

async function queue(msg) {
    const queue = allQueues[msg.guild.id];
    if (queue && queue.songs.length !== 0) {
        const pages = queue.songs.length / 30;
        let page = 0;

        let navigating = true;
        let send = true;
        while (navigating) {
            let prettyQueue = '```haskell\n';
            let i = 0;
            for (const song of queue.songs.slice(page * 30, (page + 1) * 30)) {
                prettyQueue += `${i++ + 1}) ${song.title.substring(0, 70)} ${song.duration}\n`;
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
        await msg.channel.send(new MessageEmbed().setDescription('The queue is `empty`'));
    }
}

function filter(reaction, user) {
    return ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot;
}

async function remove(msg, [item]) {
    if (item) {
        const queue = allQueues[msg.guild.id];
        if (queue && queue.songs.length > 0) {
            if (item === 'all') {
                queue.songs = [];
                if (queue.connection && queue.connection.dispatcher) {
                    queue.connection.dispatcher.destroy();
                }
                await msg.channel.send('Cleared queue!');
            } else if (!isNaN(+item)) {
                item = +item - 1;
                if (item < 0 || item > queue.songs.length) {
                    await msg.channel.send('Invalid item id');
                } else {
                    let deleted;
                    if (item === 0) {
                        deleted = [{...queue.songs[0]}];
                        if (queue.songs.length > 1) {
                            await skip(msg);
                        } else {
                            queue.connection.dispatcher.destroy();
                            queue.songs = [];
                        }
                    } else {
                        deleted = queue.songs.splice(item, 1);
                    }
                    await msg.channel.send(`Removed \`${deleted[0].title}\` from the queue`);
                }
            } else {
                await msg.channel.send('Invalid item id');
            }
        } else {
            await msg.channel.send(new MessageEmbed().setDescription('The queue is `empty`'));
        }
    } else {
        await msg.channel.send('No item id given');
    }
}

async function now(msg) {
    const queue = allQueues[msg.guild.id];
    if (queue && queue.connection && queue.connection.dispatcher) {
        const song = queue.songs[0];

        const pauseTime = song.dispatcher.paused ? Date.now() - song.dispatcher.pausedSince + song.pauseTime : song.pauseTime;
        const playSeconds = msToSeconds(Date.now() - song.dispatcher.startTime - pauseTime);
        const playTime = secondsToTime(playSeconds || 0);
        const length = 20;
        const progress = Math.round(length / 100 * (100 / song.durationSeconds * playSeconds));
        const progressBar = song.isLive ? '' : replaceAt('─'.repeat(length), progress, '⚪');
        const embed = new MessageEmbed()
            .setTitle(song.title)
            .setThumbnail(song.thumbnail)
            .addField('Progress', `${progressBar}  ${playTime} / ${song.isLive ? 'Live' : song.duration}`);
        await msg.channel.send(embed);
    } else {
        await msg.channel.send('Not playing any song');
    }
}

async function repeat(msg) {
    const queue = allQueues[msg.guild.id];
    if (queue) {
        queue.repeat = (queue.repeat + 1) % 3;
        switch (queue.repeat) {
            case 0:
                return msg.channel.send(new MessageEmbed().setDescription('Looping is `disabled`'));
            case 1:
                return msg.channel.send(new MessageEmbed().setDescription('Looping `the queue`'));
            case 2:
                return msg.channel.send(new MessageEmbed().setDescription('Looping `song`'));
        }
    } else {
        await msg.channel.send('There is no queue for this server');
    }
}

function replaceAt(string, index, replacement) {
    return string.substr(0, index) + replacement + string.substr(index + replacement.length);
}

const play_ = {
    description: () => 'Play a song from youtube',
    help: (prefix) => `eg: \`${prefix}play https://www.youtube.com/watch?v=uKxyLmbOc0Q\``
}

const stop_ = {
    description: () => 'Disconnect bot',
    help: (prefix) => `eg: \`${prefix}stop\``
}

const skip_ = {
    description: () => 'Skip a song',
    help: (prefix) => `eg: \`${prefix}skip [(optional) item_id to skip to]\``
}

const pause_ = {
    description: () => 'Pause song',
    help: (prefix) => `eg: \`${prefix}pause\``
}

const resume_ = {
    description: () => 'Resume song',
    help: (prefix) => `eg: \`${prefix}resume\``
}

const queue_ = {
    description: () => 'Song queue',
    help: (prefix) => {
        return '' +
            `\`${prefix}queue\` -> Get queue\n` +
            `\`${prefix}queue clear\` -> Clear queue\n`;
    }
}

const remove_ = {
    description: () => 'Remove a song from queue',
    help: (prefix) => {
        return `${prefix}remove <item_id>\n` +
            `\`${prefix}remove 2\` -> Remove item 2\n` +
            `\`${prefix}remove all\` -> Same as \`${prefix}clear\`\n`;
    }
}

const now_ = {
    description: () => 'Get the currently playing song',
    help: (prefix) => `eg: \`${prefix}now\``
}

const repeat_ = {
    description: () => 'Repeat the song or queue',
    help: (prefix) => `eg: \`${prefix}repeat\``
}

module.exports = {
    play,
    stop,
    skip,
    pause,
    resume,
    queue,
    remove,
    now,
    repeat,
    play_,
    stop_,
    skip_,
    pause_,
    resume_,
    queue_,
    remove_,
    now_,
    repeat_,
}