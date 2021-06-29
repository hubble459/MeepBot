import { Message, MessageEmbed } from 'discord.js';
import MessageButton from '../../model/button/message_button';
import Category from '../../model/category';
import { args, bad, button, Command, ExecData } from '../../model/docorators/command';
import ButtonInteractionEvent from '../../model/interaction/button_interaction_event';
import MessageInteractionEvent from '../../model/interaction/message_interaction_event';
import SlashInteractionEvent, { SlashOptionTypes } from '../../model/interaction/slash_interaction_event';
import { Music } from '../../model/music';
import { millisecondsToTime } from '../../util/util';

const SONGS_PER_PAGE = 20;

const QUEUE_NEXT = 'queue_next';
const QUEUE_PREVIOUS = 'queue_prev';
const next = new MessageButton().setLabel('next').setCustomId(QUEUE_NEXT);
const prev = new MessageButton().setLabel('prev').setCustomId(QUEUE_PREVIOUS);

@Command('queue', Category.music)
class Queue {
    @args(/clear|true/, 'clear', 'clear the queue', false, SlashOptionTypes.boolean)
    async clear({ interaction }: ExecData) {
        const music = interaction.bot.musicPlayer.getMusic(interaction);
        if (music) {
            const cleared = await interaction.bot.musicPlayer.clear(interaction);
            if (cleared) {
                interaction.send(interaction.getString('remove_cleared', music.queue.length));
            }
        }
    }

    @args(true)
    async queue({ interaction }: ExecData) {
        const music = interaction.bot.musicPlayer.getMusic(interaction);
        if (music) {
            const embed = this.createQueueEmbed(interaction);
            let msg: Message;
            if (interaction instanceof MessageInteractionEvent) {
                msg = await interaction.send(embed, prev, next);
            } else {
                msg = await interaction.send(embed, false, prev, next);
            }
            interaction.bot.cache.set(msg.id, this.currentPage(music));
        } else {
            await interaction.send('sksksksks');
        }
    }

    @bad
    async noArgs({ interaction }: ExecData) {
        interaction.send('incorrect argument passed');
    }

    @button(QUEUE_NEXT)
    async queueNext(interaction: ButtonInteractionEvent) {
        const page = <number>interaction.bot.cache.get(interaction.message.id);
        if (page !== undefined) {
            const music = interaction.bot.musicPlayer.getMusic(interaction);
            if (!music || page + 1 === Math.ceil(music.queue.length / SONGS_PER_PAGE)) {
                return;
            }
            interaction.bot.cache.set(interaction.message.id, page + 1);
            await this.changePage(interaction);
        }
    }

    @button(QUEUE_PREVIOUS)
    async queuePrev(interaction: ButtonInteractionEvent) {
        const page = <number>interaction.bot.cache.get(interaction.message.id);
        if (page !== undefined) {
            if (page - 1 < 0) {
                return;
            }
            interaction.bot.cache.set(interaction.message.id, page - 1);
            await this.changePage(interaction);
        }
    }

    async changePage(interaction: ButtonInteractionEvent) {
        await interaction.edit(this.createQueueEmbed(interaction), false, prev, next);
    }

    createQueueEmbed(interaction: ButtonInteractionEvent | MessageInteractionEvent | SlashInteractionEvent) {
        const music = interaction.bot.musicPlayer.getMusic(interaction);
        if (music) {
            const pages = Math.ceil(music.queue.length / SONGS_PER_PAGE);
            const total = music.queue.length;
            const page =
                interaction && interaction.message
                    ? <number>interaction.bot.cache.get(interaction.message.id) || this.currentPage(music) : this.currentPage(music)
            const duration = music.queue.reduce((duration, song) => duration + song.durationMS, 0);
            const queue = music.queue
                ? music.queue
                    .slice(page * SONGS_PER_PAGE, (page + 1) * SONGS_PER_PAGE)
                    .map((s, i) => `${i + page * SONGS_PER_PAGE === music.current ? '!' : '-'}${i + 1 + page * SONGS_PER_PAGE}. ${s.title}`)
                    .join('\n')
                : 'empty';
            const embed = new MessageEmbed()
                .setTitle('Queue')
                .setColor('#ebeb34')
                .setDescription('```diff\n' + queue + '```')
                .addField('Total', total, true)
                .addField('Duration', millisecondsToTime(duration), true)
                .setFooter(`page ${page + 1} of ${pages}`);
            return embed;
        }
        return 'uWu';
    }

    currentPage(music: Music) {
        const pages = Math.ceil(music.queue.length / SONGS_PER_PAGE);
        const total = music.queue.length;
        let current = music.current;

        if (current >= total) {
            current = music.queue.length - 1;
        }

        return Math.floor((pages / total) * current);
    }
}

export default Queue;
