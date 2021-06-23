import { MessageEmbed, User } from 'discord.js';
import Category from '../model/category';
import { Command, args, ExecData, bad } from '../model/docorators/command';
import SlashInteractionEvent from '../model/interaction/slash_interaction_event';

@Command('ping', Category.miscellaneous, 0, 'response')
class Ping {
    @args(true)
    async pong({ interaction }: ExecData) {
        const { getString, channel } = interaction;
        const pingDiff = getString('ping_diff');
        if (interaction instanceof SlashInteractionEvent) {
            const now = Date.now();
            await interaction.think(true);
            const sendTime = Math.floor((Date.now() - now) / 2);

            await interaction.edit(this.pingEmbed(pingDiff, sendTime));
        } else {
            await channel.send(
                this.pingEmbed(pingDiff, Date.now() - interaction.message.createdTimestamp, interaction.user)
            );
        }
    }

    private pingEmbed(pingDiff: string, time: string | number, user?: User) {
        const embed = new MessageEmbed().setDescription(pingDiff.format(time));
        if (user) {
            embed.setFooter(user.username, `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`);
        }
        return embed;
    }

    @bad
    async bad(data: ExecData) {
        await this.pong(data);
    }
}

export default Ping;
