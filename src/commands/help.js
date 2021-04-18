const {MessageEmbed} = require('discord.js');
const database = require('../utils/database');
const getCommands = require('../utils/commands');
const commands = getCommands(__filename);

const groups = {};
for (const [name, cmd] of Object.entries(commands)) {
    cmd.name = name;
    if (!groups[cmd.group || 'misc']) {
        groups[cmd.group || 'misc'] = [];
    }
    groups[cmd.group || 'misc'].push(cmd);
}

async function help(msg, [command]) {
    const prefix = database.get(msg.guild.id, 'settings.prefix') + (database.get(msg.guild.id, 'settings.space') ? ' ' : '');
    if (command) {
        let cmd = commands[command];

        while (!cmd) {
            const aliasCommand = database.get(msg.guild.id, `aliases.${command}`);
            if (aliasCommand) {
                cmd = commands[aliasCommand.command];
                command = aliasCommand.command;
            } else {
                break;
            }
        }

        if (cmd) {
            const embed = new MessageEmbed()
                .setTitle(command)
                .addField(cmd.description(), cmd.help(prefix));

            await msg.channel.send(embed);
        } else {
            await msg.channel.send(`Command \`${command}\` not found`);
        }
    } else {
        const fields = [];
        for (const [group, commands] of Object.entries(groups)) {
            const body =
                '```apache\n' +
                commands
                    .map(command => `${prefix}${command.name}`)
                    .join('\n') +
                '```';

            fields.push({name: group, value: body, inline: true});
        }

        const embed = new MessageEmbed()
            .setTitle('help')
            .addFields(...fields)
            .setDescription(`use \`${prefix}help [command]\` for more info`)
            .setTimestamp();

        await msg.channel.send(embed);
    }
}

function description() {
    return 'This menu';
}

function info() {
    return 'Use `help <command>` to get more information about a command\nOr just `help` to show the help menu';
}

module.exports = {
    'help': {
        'function': help,
        'description': description,
        'help': info,
        'group': 'misc',
        'permissions': 59456,
    }
};