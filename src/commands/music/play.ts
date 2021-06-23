import { MessageEmbed } from 'discord.js';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import ytsr, { Video } from 'ytsr';
import { Spotify } from 'simple-spotify';
import Category from '../../model/category';
import { args, bad, Command, ExecData } from '../../model/docorators/command';
import MessageInteractionEvent from '../../model/interaction/message_interaction_event';
import SlashInteractionEvent from '../../model/interaction/slash_interaction_event';
import { Song, SongType } from '../../model/music';
import { stringToMilliseconds } from '../../util/util';

@Command('play', Category.music, 0, 'p')
class Play {
    private readonly spotify: Spotify = new Spotify();

    @args(/^(https?:\/\/)?(w{3}\.)?youtu(be|\.be)?(\.com)?\/.*\?.*list=.+$/, 'song', 'Song or URL', true)
    async playYTPlaylist({ interaction }: ExecData) {
        const url = interaction.args[0] as string;
        const playlist = await ytpl(url);

        const embed = new MessageEmbed()
            .setTitle(playlist.title)
            .setURL(url)
            .setDescription(playlist.items.length + ' items');

        await interaction.send(embed);

        const requestor = this.getRequestor(interaction);

        const songs = playlist.items.map(
            (video) =>
                ({
                    title: video.title,
                    thumbnail: video.bestThumbnail.url,
                    durationMS: (video.durationSec || 0) * 1000,
                    type: SongType.YOUTUBE,
                    url: video.url,
                    isLive: video.isLive,
                    requestor
                } as Song)
        );

        await interaction.bot.musicPlayer.play(interaction, ...songs);
    }

    @args(/^(https?:\/\/)?(w{3}\.)?youtu(be|\.be)?(\.com)?\/watch?.+/)
    async playYTVideo({ interaction }: ExecData) {
        const url = interaction.args[0] as string;
        const track = (await ytdl.getBasicInfo(url)).videoDetails;

        if (track.age_restricted) {
            await interaction.send("Currently can't play age restricted videos :c");
        } else {
            const song: Song = {
                title: track.title,
                thumbnail: track.thumbnails[0].url || undefined,
                isLive: track.isLiveContent,
                type: SongType.YOUTUBE,
                durationMS: +track.lengthSeconds * 1000,
                url: track.video_url,
                requestor: this.getRequestor(interaction)
            };

            await interaction.bot.musicPlayer.play(interaction, song);
        }
    }

    @args(/^(https?:\/\/)?(w{3}\.)?soundcloud\.com\/.+/)
    async playSoundcloud({ interaction }: ExecData) {
        const url = interaction.args[0] as string;
        const track = await interaction.bot.musicPlayer.soundcloud.playlists.getV2(url);
        const song: Song = {
            title: track.title,
            thumbnail: track.artwork_url || undefined,
            isLive: false,
            type: SongType.SOUNDCLOUD,
            durationMS: track.duration / 10,
            url: track.permalink_url,
            requestor: this.getRequestor(interaction)
        };

        await interaction.bot.musicPlayer.play(interaction, song);
    }

    @args(/^(https?:\/\/)?(w{3}\.)?.*\.((mp(4|3))|mov)/)
    async playFile({ interaction }: ExecData) {
        const url = interaction.args[0] as string;
        await interaction.bot.musicPlayer.play(interaction, {
            title: url.slice(url.lastIndexOf('/') + 1),
            durationMS: 0,
            thumbnail: '',
            url,
            isLive: false,
            type: SongType.LOCAL,
            requestor: this.getRequestor(interaction)
        });
    }

    @args(/^(https?:\/\/)(w{3}\.)?.+/)
    async playUnsupported({ interaction }: ExecData) {
        interaction.send(interaction.getString('play_unsupported'));
    }

    @args(['**'])
    async playSearch({ interaction }: ExecData) {
        const query = interaction.args.join(' ');
        const queryFilterMap = await ytsr.getFilters(query);
        if (queryFilterMap) {
            const filters = queryFilterMap.get('Type');
            if (filters) {
                const filter = filters.get('Video');
                if (filter && filter.url) {
                    const items = (await ytsr(filter.url, { limit: 5 })).items as Video[];
                    const requestor = this.getRequestor(interaction);
                    for (const video of items) {
                        if (!video.upcoming && !video.isUpcoming) {
                            // TODO: Show choice menu
                            const song: Song = {
                                title: video.title,
                                thumbnail: video.bestThumbnail.url || undefined,
                                isLive: video.isLive,
                                durationMS: stringToMilliseconds(video.duration || undefined),
                                type: SongType.YOUTUBE,
                                url: video.url,
                                requestor
                            };

                            await interaction.bot.musicPlayer.play(interaction, song);
                            break;
                        }
                    }
                }
            }
        }
    }

    @args()
    async resume({ interaction }: ExecData) {
        await interaction.bot.musicPlayer.connect(interaction);
        await interaction.bot.musicPlayer.nextSong(interaction);
    }

    @bad
    async error({ interaction }: ExecData) {
        await interaction.send(interaction.getString('echo_empty'));
    }

    getRequestor(interaction: MessageInteractionEvent | SlashInteractionEvent) {
        const user = interaction.user;
        return {
            name: user.tag,
            avatar:
                (user.avatarURL ? user.avatarURL() : undefined) ||
                `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
            id: user.id
        };
    }
}

export default Play;
