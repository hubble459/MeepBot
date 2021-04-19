const strings = require('../utils/strings');

async function echo(msg, args) {
    const message = args.join(' ');
    if (message.length === 0) {
        const string = strings.getString(msg.guild.id, 'echo_empty');
        await msg.channel.send(string);
    } else {
        await msg.channel.send(message);
    }
}

function description() {
    return 'Make me say lewd stuff :3';
}

function help(prefix) {
    return `Use \`${prefix}echo [words]\`\neg. \`${prefix}echo I'm so adowable uwu\``;
}

module.exports = {
    'echo': {
        'function': echo,
        'description': description,
        'help': help,
        'group': 'misc',
    }
};