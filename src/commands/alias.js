const {prefix} = require('../utils/config');
const servers = {};

async function alias(msg, msgArgs) {
    const newCommand = msgArgs[0];
    if (msgArgs.length > 1) {
        if (newCommand.startsWith(prefix)) {
            await msg.channel.send('Command should not start with a prefix');
        } else {
            let server = servers[msg.guild.id];
            if (!server) {
                server = servers[msg.guild.id] = {};
            }
            const command = msgArgs[1];
            const args = msgArgs.slice(2);
            server[newCommand] = {
                command,
                args
            };
            await msg.channel.send(`Command '${newCommand}' added!`);
        }
    } else {
        await msg.channel.send('Alias needs at least 2 commands');
    }
}

function getAliasses(guildId) {
    return servers[guildId] || {};
}

function help(prefix) {
    return '```apache\n' +
        `${prefix}alias [command_name] [command]\n` +
        `Examples:\n` +
        `\t${prefix}alias owo echo fuck my ass\n` +
        `\t${prefix}alias nice play https://www.youtube.com/watch?v=myax0WsTSWA\n` +
        '```';
}

function description() {
    return `Use ${prefix}alias [command_name] [command]`;
}

module.exports = {
    alias,
    getAliasses,
    help,
    description
};