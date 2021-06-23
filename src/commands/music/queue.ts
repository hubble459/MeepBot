import { MessageEmbed } from 'discord.js';
import Category from '../../model/category';
import { args, bad, Command, ExecData } from '../../model/docorators/command';
import { SlashOptionTypes } from '../../model/interaction/slash_interaction_event';

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
            let embed: string | MessageEmbed;
            if (music.queue.length) {
                embed = music.queue.map((s, i) => i + 1 + '. ' + s.title).join('\n');
            } else {
                embed = interaction.getString('music_empty_queue');
            }
            interaction.send(embed);
        }
    }

    @bad
    async noArgs({ interaction }: ExecData) {
        interaction.send('incorrect argument passed');
    }
}

export default Queue;
