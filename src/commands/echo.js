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

module.exports = {
    'echo': {
        'function': echo,
        'description': 'echo_description',
        'help': 'echo_help',
        'group': 'misc',
    }
};