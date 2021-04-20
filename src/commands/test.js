const {MessageAttachment} = require('discord.js');

async function test(message) {
    if (message.author.id === '316594280678293506') {
        const msg = await message.channel.send('comment on me uwu');

        while (true) {
            try {
                const collections = await msg.awaitReactions(() => true, {
                    max: 1,
                    time: 300000,
                    errors: ['time']
                });
                const reaction = collections.first();
                await message.channel.send(reaction.emoji.name);
            } catch (e) {
                break;
            }
        }
    } else {
        const image = './src/assets/images/dont_touch.jpg';
        const attachment = new MessageAttachment(image, 'image.jpg');
        await message.channel.send(attachment);
    }
}

module.exports = {
    'test': {
        'function': test,
        'group': 'misc',
    }
};