import { EmbedField, MessageEmbed } from 'discord.js';
import Category from '../model/category';
import { args, bad, Command, CommandType, ExecData } from '../model/docorators/command';
import MessageInteractionEvent from '../model/interaction/message_interaction_event';

@Command('help', Category.miscellaneous)
class Help {
    @args(true)
    async allCommands({ interaction }: ExecData) {
        const { guild, bot, getString, settings } = interaction;
        const categories = new Map<string, CommandType[]>();
        bot.commands(guild).forEach((cmd) =>
            categories.set(cmd.category, [...(categories.get(cmd.category) || []), cmd])
        );
        const fields: EmbedField[] = [];
        categories.forEach((commands, category) =>
            fields.push({
                name: category,
                value: commands
                    .map((cmd) => {
                        const desc = cmd.description.endsWith('_description')
                            ? getString(cmd.description)
                            : cmd.description;
                        return `[\`${settings.prefix}${cmd.name}\`](https://github.com/MeepBot "${desc}")`;
                    })
                    .join('\n'),
                inline: true
            })
        );

        const embed = new MessageEmbed().addFields(...fields).setFooter(`${settings.prefix}help [command]`);
        if (interaction instanceof MessageInteractionEvent) {
            await interaction.send(embed);
        } else {
            await interaction.send(embed, true);
        }
    }

    @args(['\\w+'], 'command', 'command name')
    async command({ interaction }: ExecData) {
        const { bot, getString, settings } = interaction;

        let embed: MessageEmbed | string;
        const command = bot.getCommand(settings, interaction.args[0] as string);

        if (command) {
            embed = new MessageEmbed().addField(
                'usage',
                '```apache\n' + getString(command.help).format(settings.prefix) + '```'
            );
            if (command.aliases.length) {
                embed.addField(`alias${command.aliases.length !== 1 ? 's' : ''}`, command.aliases.join(', '));
            }
        } else {
            embed = getString('help_not_found');
        }
        await interaction.send(embed);
    }

    @bad
    async notACommand({ interaction }: ExecData) {
        const { getString } = interaction;
        await interaction.send(getString('help_not_found'));
    }
}

export default Help;
