// noinspection NonAsciiCharacters

const {MessageAttachment, MessageEmbed} = require('discord.js');
const {name, dialog} = require('../../test.json');
const responses = {};
const data = [];
const emojis = {
    '0️⃣': 0,
    '1️⃣': 1,
    '2️⃣': 2,
    '3️⃣': 3,
    '4️⃣': 4,
    '5️⃣': 5,
    '6️⃣': 6,
    '7️⃣': 7,
    '8️⃣': 8,
    '9️⃣': 9,
    '🔟': 10,
};

async function test(message) {
    if (message.author.id === '316594280678293506') {
        // await commentSpam(message);
        data.length = 0;
        const msg = await message.channel.send(new MessageEmbed().setTitle('Loading...'));
        await storyTest(msg, dialog);
    } else {
        const image = './src/assets/images/dont_touch.jpg';
        const attachment = new MessageAttachment(image, 'image.jpg');
        await message.channel.send(attachment);
    }
}

async function storyTest(msg, dialog) {
    for (const state of dialog) {
        if (state.choices) {
            const choices = state.choices.map((c, i) => (i) + '. ' + c).join('\n');
            data.push(choices);
            await editMessage(msg);
            const choice = await awaitResponse(msg, state.choices.length, 30000);
            data.pop();
            responses[state.id] = choice;
            state.say = state.choices[choice];
        } else if (state.requirements !== undefined) {
            let enter = false;
            for (let requirement of state.requirements) {
                const response = responses[requirement.id];
                enter = response === requirement.is;
                if (!enter) break;
            }

            if (!enter) {
                continue;
            } else if (state.dialog) {
                await storyTest(msg, state.dialog);
                continue;
            }
        }
        data.push(state.character + ': ' + state.say);
        await editMessage(msg);
        await sleep(state.ms || 1000);
    }
}

async function awaitResponse(msg, amount, ms) {
    const emj = Object.keys(emojis).slice(0, amount);
    for (const e of emj) {
        await msg.react(e);
    }
    const reaction = (await msg.awaitReactions(({emoji: {name}}) => emj.includes(name), {
        max: 1,
        time: ms,
        errors: ['time']
    })).first();
    await msg.reactions.removeAll();
    console.log(emojis[reaction.emoji.name]);
    return emojis[reaction.emoji.name];
}

async function editMessage(msg) {
    const embed = new MessageEmbed()
        .setTitle(name)
        .setDescription(data.join('\n'));
    return msg.edit(embed);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// noinspection JSUnusedLocalSymbols
async function commentSpam(message) {
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
}

module.exports = {
    'test': {
        'function': test,
        'group': 'misc',
    }
};