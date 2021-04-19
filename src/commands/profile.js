const {MessageEmbed} = require('discord.js');

async function profile(msg) {
    const embed = new MessageEmbed()
        .setTitle(msg.author.username)
        .setThumbnail(msg.author.displayAvatarURL())
        .addField('\u200b', 'owo');
    await msg.channel.send(embed);
}

function description() {
    return 'Profile';
}

function help(prefix) {
    return `${prefix}mine`;
}

module.exports = {
    'profile': {
        'function': profile,
        'description': description,
        'help': help,
        'group': 'misc',
    }
};