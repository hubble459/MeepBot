import { Message, MessageEmbed } from 'discord.js';
import Enmap from 'enmap';
import Soundcloud from 'soundcloud.ts';
import MessageInteractionEvent from '../model/interaction/message_interaction_event';
import SlashInteractionEvent from '../model/interaction/slash_interaction_event';
import { Music, RepeatType, Song, SongType } from '../model/music';
import { millisecondsToTime } from './util';
import ytdl from 'ytdl-core';
// @ts-ignore
// import youtube_dl from 'magmaplayer';
// import ytdl, { search, YoutubeInfo } from 'better-ytdl';
import ButtonInteractionEvent from '../model/interaction/button_interaction_event';
import { Readable } from 'stream';
import { search, YoutubeInfo } from 'better-ytdl';
import ytsr, { Video } from 'ytsr';

class MusicPlayer {
    public readonly soundcloud: Soundcloud;
    public readonly musicMap: Enmap;

    constructor(databaseDir: string) {
        this.soundcloud = new Soundcloud();
        this.musicMap = new Enmap({
            name: 'music',
            dataDir: databaseDir,
            autoFetch: true,
            fetchAll: false
        });
    }

    public async play(interaction: MessageInteractionEvent | SlashInteractionEvent, ...songs: Song[]) {
        const conn = await this.connect(interaction);
        if (conn) {
            const musicSettings: Music = {
                current: 0,
                queue: [],
                repeat: RepeatType.NO_REPEAT
            };

            const guildId = interaction.guild!.id;
            const music = this.musicMap.ensure(guildId, musicSettings) as Music;
            music.queue = [...music.queue, ...songs];
            music.current = music.queue.length < music.current ? 0 : music.current;
            this.musicMap.set(guildId, music);

            if (!conn.dispatcher) {
                await this.nextSong(interaction);
            } else if (songs.length > 1) {
                interaction.send(
                    new MessageEmbed()
                        .setTitle('Queued')
                        .setAuthor(`Requested by ${songs[0].requestor.name}`, songs[0].requestor.avatar)
                        .setDescription(`Added ${songs.length} songs`)
                        .setThumbnail(songs[0].thumbnail || '')
                        .addField('Duration', millisecondsToTime(songs.reduce((dur, song) => dur += song.durationMS, 0)))
                        .setColor('#696969')
                )
            } else {
                const song = songs[0];
                const pos = music.queue.indexOf(song);
                const durationUntil = music.queue.slice(music.current, pos).reduce((dur, song) => dur += song.durationMS, 0);
                interaction.send(
                    new MessageEmbed()
                        .setTitle('Queued')
                        .setAuthor(`Requested by ${song.requestor.name}`, song.requestor.avatar)
                        .setDescription(`[${song.title}](${song.url})`)
                        .setThumbnail(song.thumbnail || '')
                        .addField('Duration', millisecondsToTime(song.durationMS))
                        .addField('Will play after', millisecondsToTime(durationUntil))
                        .setColor('#696969')
                )
            }
        }
    }

    public getMusic(interaction: MessageInteractionEvent | SlashInteractionEvent | ButtonInteractionEvent) {
        if (interaction.guild) {
            return this.musicMap.get(interaction.guild.id) as Music;
        }
    }

    public async skip(interaction: MessageInteractionEvent | SlashInteractionEvent) {
        const connection = await this.connect(interaction, true);
        if (connection) {
            const music = this.getMusic(interaction);
            if (music) {
                const song = music.queue[music.current];
                const next = music.queue[music.current + 1];

                if (connection.dispatcher) {
                    connection.dispatcher.end();
                }
                await interaction.send(
                    interaction.getString('skip_notify', song.title, next ? next.title : 'nothing')
                );
            }
        }
    }

    public async nextSong(
        interaction: MessageInteractionEvent | SlashInteractionEvent,
        respond: boolean = true,
        message?: Message
    ) {
        const music = this.getMusic(interaction);

        if (music && music.queue.length) {
            const connection = await this.connect(interaction, true);

            if (connection) {
                const song = music.queue[music.current];

                if (!song) {
                    return;
                }

                let stream: string | Readable = song.url;

                if (song.type === SongType.YOUTUBE) {
                    stream = ytdl(song.url);
                } else if (song.type === SongType.SOUNDCLOUD) {
                    stream = await this.soundcloud.util.streamTrack(stream) as Readable;
                } else if (song.type === SongType.SPOTIFY) {
                    const searchResults = await this.searchYoutube(song.artist + ' ' + song.title);
                    if (searchResults && searchResults[0]) {
                        song.url = searchResults[0].url;
                        stream = ytdl(searchResults[0].url);
                    } else {
                        await interaction.send(`ooga booga, song not found (${song.artist + ' ' + song.title})`);
                        this.musicMap.set(interaction.guild!.id, music.current + 1, 'current');
                        await this.nextSong(interaction);
                        return;
                    }
                }

                if (respond) {
                    const embed = new MessageEmbed()
                        .setTitle('Playing')
                        .setDescription(`[${song.title}](${song.url})`)
                        .setColor('#b00b69')
                        .setThumbnail(song.thumbnail || '')
                        .addField('Duration', millisecondsToTime(song.durationMS))
                        .setAuthor(`Requested by ${song.requestor.name}`, song.requestor.avatar);
                    if (!message) {
                        message = await interaction.send(embed);
                    } else if (interaction instanceof MessageInteractionEvent) {
                        await message.edit(embed);
                    } else {
                        await interaction.edit(embed);
                    }
                }

                if (!connection.dispatcher) {
                    connection
                        .play(stream)
                        .on('close', () => {
                            if (music.repeat === RepeatType.NO_REPEAT && music.queue.length === music.current + 3) {
                                return;
                            }

                            if (music.repeat !== RepeatType.SONG_REPEAT) {
                                this.musicMap.set(
                                    interaction.guild!.id,
                                    (music.repeat === RepeatType.QUEUE_REPEAT ? (music.current + 1) % music.queue.length : music.current + 1),
                                    'current'
                                );
                            }
                            this.nextSong(interaction, true, message);
                        })
                        .on('error', (e) => {
                            console.error(...interaction.tag(e));
                            this.skip(interaction);
                        });
                }
            }
        }
    }

    async searchYoutube(query: string, limit: number = 1) {
        // const filter1 = await ytsr.getFilters(query);
        // if (filter1) {
        //     const filter2 = filter1.get('Type');
        //     if (filter2) {
        //         const filter3 = filter2.get('Video');
        //         if (filter3 && filter3.url) {
        //             const filter4 = await ytsr.getFilters(filter3.url);
        //             if (filter4) {
        //                 const filter5 = filter4.get('Features');
        //                 if (filter5) {
        //                     const filter6 = filter5.get('Live');
        //                     if (filter6 && filter6.url) {
                                // const searchResults = await ytsr(filter6.url, { limit });
                                const searchResults = await ytsr(query, { limit });                                
                                return searchResults.items as Video[];
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }        
    }

    async currentlyPlaying(interaction: MessageInteractionEvent | SlashInteractionEvent) {
        const conn = await this.getConnection(interaction);
        return conn && conn.voice && conn.voice.connection && conn.voice.connection.dispatcher;
    }

    async connect(interaction: MessageInteractionEvent | SlashInteractionEvent, system: boolean = false) {
        const { guild, member, getString, bot } = interaction;
        if (guild && member && bot.voice) {
            const voiceChannel = member.voice ? member.voice.channel : undefined;
            if (voiceChannel || system) {
                const connection = bot.voice.connections.get(guild.id);
                if (connection) {
                    if (system || connection.channel.id === voiceChannel!.id) {
                        return connection;
                    } else {
                        await interaction.send(getString('play_other_channel'));
                    }
                } else if (voiceChannel) {
                    return voiceChannel.join();
                }
            } else {
                await interaction.send(getString('play_join_vc'));
            }
        } else {
            await interaction.send(getString('play_no_dm'));
        }
        return false;
    }

    async clear(interaction: MessageInteractionEvent | SlashInteractionEvent, hasToBeInSameVC: boolean = true) {
        const connection = await this.hasConnection(interaction);
        if (connection && connection.dispatcher) {
            connection.dispatcher.destroy();
        }

        if (interaction.guild) {
            this.musicMap.set(interaction.guild.id, [], 'queue');
            this.musicMap.set(interaction.guild.id, 0, 'current');
            return true;
        }
        return false;
    }

    async stop(interaction: MessageInteractionEvent | SlashInteractionEvent, hasToBeInSameVC: boolean = true) {
        const connection = await this.getConnection(interaction, hasToBeInSameVC);
        if (connection) {
            connection.dispatcher.destroy();
            return true;
        }
        return false;
    }

    async hasConnection(interaction: MessageInteractionEvent | SlashInteractionEvent) {
        if (interaction.bot.voice && interaction.guild) {
            const connection = interaction.bot.voice.connections.get(interaction.guild.id);
            if (connection) {
                return connection;
            }
        }
        return false;
    }

    async getConnection(interaction: MessageInteractionEvent | SlashInteractionEvent, hasToBeInSameVC: boolean = true) {
        const { guild, member, getString, bot } = interaction;
        if (guild && member && bot.voice) {
            const voiceChannel = member.voice ? member.voice.channel : undefined;
            if (voiceChannel || !hasToBeInSameVC) {
                const connection = bot.voice.connections.get(guild.id);
                if (connection) {
                    if (!hasToBeInSameVC || connection.channel.id === voiceChannel!.id) {
                        return connection;
                    } else {
                        await interaction.send(getString('play_other_channel'));
                    }
                } else {
                    await interaction.send(getString('stop_not_connected'));
                }
            } else {
                await interaction.send(getString('play_join_vc'));
            }
        } else {
            await interaction.send(getString('play_no_dm'));
        }
        return false;
    }
}

export default MusicPlayer;
