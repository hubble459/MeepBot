const database = require('../utils/database');
const getCommands = require('../utils/commands');
const defaultAliases = require('../utils/default_aliases');
const commands = getCommands(__filename, 'help');
const {MessageEmbed} = require('discord.js');
const strings = require('../utils/strings');

async function alias(msg, msgArgs) {
    const newCommand = msgArgs[0];
    if (msgArgs.length > 1) {
        if (commands[newCommand] || newCommand === 'help') {
            await msg.channel.send(strings.getString(msg.guild.id, 'alias_override'));
        } else if (newCommand.startsWith(database.get(msg.guild.id, 'settings.prefix'))) {
            await msg.channel.send(strings.getString(msg.guild.id, 'alias_prefix'));
        } else {
            let command = msgArgs[1];
            let s = 2;
            if (!commands[command] && !database.has(msg.guild.id, `aliases.${command}`) && command !== 'help') {
                command = 'echo';
                s = 1;
            }
            const args = msgArgs.slice(s);

            const existed = database.has(msg.guild.id, `aliases.${newCommand}`);
            database.set(msg.guild.id, {
                command,
                args
            }, `aliases.${newCommand}`);
            await msg.channel.send(strings.getString(msg.guild.id, 'alias_changed').format(newCommand, existed ? 'changed' : 'added'));
        }
    } else {
        await msg.channel.send(strings.getString(msg.guild.id, 'alias_arguments'));
    }
}

const aliasrm = {
    'function': async (msg, [alias]) => {
        if (alias) {
            const exists = database.has(msg.guild.id, `aliases.${alias}`);
            if (exists) {
                database.delete(msg.guild.id, `aliases.${alias}`);
                await msg.channel.send(strings.getString(msg.guild.id, 'aliasrm_removed').format(alias));
            } else {
                await msg.channel.send(strings.getString(msg.guild.id, 'aliasrm_find').format(alias));
            }
        } else {
            await msg.channel.send(strings.getString(msg.guild.id, 'aliasrm_arguments'));
        }
    },
    'group': 'misc'
};

const aliases = {
    'function': async (msg, [arg1]) => {
        if (arg1 === 'reset') {
            database.set(msg.guild.id, defaultAliases, 'aliases');
            await msg.channel.send(strings.getString(msg.guild.id, 'aliases_reset'));
        } else {
            const aliases = database.get(msg.guild.id, 'aliases');
            const values = [];

            const entries = Object.entries(aliases);
            const size = entries.length;
            entries
                .slice(0, 20)
                .forEach(([alias, {args, command}]) => {
                    args = args.join(' ');
                    args = args.slice(0, 20) + (args.length > 20 ? '...' : '');
                    values.push(`${alias} -> ${command} ${args}`);
                });

            const embed = new MessageEmbed()
                .addField(`${size} alias${size !== 0 ? 'es' : ''}`, '```apache\n' + values.join('\n') + '```');
            await msg.channel.send(embed);
        }
    },
    'group': 'misc'
};

module.exports = {
    'alias': {
        'function': alias,
        'group': 'misc'
    },
    aliasrm,
    aliases,
};