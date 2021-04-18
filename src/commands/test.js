const {MessageAttachment} = require('discord.js');

async function test(msg) {
    if (msg.author.id === '316594280678293506') {
        await msg.channel.send('hewo!');
    } else {
        const image = './src/assets/images/dont_touch.jpg';
        const attachment = new MessageAttachment(image, 'image.jpg');
        await msg.channel.send(attachment);
    }
}

function description() {
    return 'Command for testing things';
}

function help() {
    return `Don't use me.. 😳 im for my master only`;
}

module.exports = {
    'test': {
        'function': test,
        'description': description,
        'help': help,
        'group': 'misc',
    }
};