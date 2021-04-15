const database = require('../utils/database');

async function alias(msg, msgArgs) {
    const newCommand = msgArgs[0];
    if (msgArgs.length > 1) {
        if (newCommand.startsWith(database.get(msg.guild.id, 'settings.prefix'))) {
            await msg.channel.send('Command should not start with a prefix');
        } else {
            const command = msgArgs[1];
            const args = msgArgs.slice(2);
            database.set(msg.guild.id, {
                command,
                args
            }, `aliases.${newCommand}`);
            await msg.channel.send(`Command '${newCommand}' added!`);
        }
    } else {
        await msg.channel.send('Alias needs at least 2 commands');
    }
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
    return `Add a new name for a command`;
}

module.exports = {
    alias,
    help,
    description
};