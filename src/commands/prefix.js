const database = require('../utils/database');

async function prefix(msg, args) {
    if (args.length > 0) {
        const prefix = args.join(' ');
        database.set(msg.guild.id, prefix, 'settings.prefix');
        await msg.channel.send(`Prefix is now \`${prefix}\``);
    } else {
        await msg.channel.send(`The current prefix is \`${database.get(msg.guild.id, 'settings.prefix')}\``);
    }
}

function description() {
    return 'Chance the prefix for this server';
}

function help(prefix) {
    return '```apache\n' +
        `${prefix}prefix [prefix]\n` +
        'Example:\n' +
        `\t${prefix}prefix !` +
        '```';
}

module.exports = {
    'prefix': {
        'function': prefix,
        'description': description,
        'help': help,
        'group': 'settings'
    }
};