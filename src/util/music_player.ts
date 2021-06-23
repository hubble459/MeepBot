import { Message, MessageEmbed } from 'discord.js';
import Enmap from 'enmap';
import Soundcloud from 'soundcloud.ts';
import MessageInteractionEvent from '../model/interaction/message_interaction_event';
import SlashInteractionEvent from '../model/interaction/slash_interaction_event';
import { Music, RepeatType, Song, SongType } from '../model/music';
import { millisecondsToTime } from './util';
// @ts-ignore
import youtube_dl from 'magmaplayer';
import ytsr, { Video } from 'ytsr';
import Play from '../commands/music/play';
import ButtonInteractionEvent from '../model/interaction/button_interaction_event';

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
        if (await this.connect(interaction)) {
            const musicSettings: Music = {
                current: 0,
                queue: [],
                repeat: RepeatType.NO_REPEAT
            };

            const guildId = interaction.guild!.id;
            const music = this.musicMap.ensure(guildId, musicSettings);
            music.queue = [...music.queue, ...songs];
            music.current = music.queue.length < music.current ? 0 : music.current;
            this.musicMap.set(guildId, music);

            await this.nextSong(interaction);
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
                const message = await interaction.send(
                    interaction.getString('skip_notify', song.title, next ? next.title : 'nothing')
                );
                await this.nextSong(interaction, false, message);
            }
        }
    }

    public async nextSong(
        interaction: MessageInteractionEvent | SlashInteractionEvent,
        respond: boolean = true,
        message?: Message
    ) {
        const music = this.getMusic(interaction);
        
        if (
            music &&
            (music.current < music.queue.length ||
                (music.current === music.queue.length && music.repeat === RepeatType.QUEUE_REPEAT))
        ) {
            const connection = await this.connect(interaction, true);

            if (connection) {
                const song = music.queue[music.current];
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

                let stream: any = song.url;

                if (song.type === SongType.YOUTUBE) {
                    stream = youtube_dl(song.url);
                } else if (song.type === SongType.SOUNDCLOUD) {
                    stream = await this.soundcloud.util.streamTrack(stream);
                } else if (song.type === SongType.SPOTIFY) {
                    const track = await Play.searchYoutube(song.artist + ' ' + song.title);
                    if (track) {
                        stream = youtube_dl(track.url);
                    }
                }

                connection
                    .play(stream)
                    .on('finish', () => {
                        if (music.repeat !== RepeatType.SONG_REPEAT) {                            
                            this.musicMap.set(
                                interaction.guild!.id,
                                ((music.current + 1) % music.queue.length) -
                                (music.repeat === RepeatType.QUEUE_REPEAT ? 1 : 0),
                                'current'
                            );
                            //music.repeat === RepeatType.QUEUE_REPEAT
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
