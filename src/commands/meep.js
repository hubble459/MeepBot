const database = require('../utils/database');
const {MessageEmbed} = require('discord.js');
const {regex, getRandomHentai, getHentaiData} = require('../utils/nhentai');
const sessions = [];

async function meep(msg, args) {
    const arg = args[0];
    if (!arg) {
        await msg.channel.send(await getRandomHentai());
    } else if (arg === 'english') {
        await msg.channel.send(await getRandomHentai(true));
    } else if (arg === 'page') {
        await gotoPage(msg, args[1]);
    } else if (arg === 'read') {
        let url = args[1];
        if (url && /^\d+$/.test(url)) {
            url = `https://nhentai.net/g/${url}/`;
        }
        const validUrl = !!url && regex.test(url);
        const page = args[2] || 1;
        await readHentai(msg.channel, validUrl ? url : await getRandomHentai(url === 'english'), validUrl ? page : 1);
    } else {
        const prefix = database.get(msg.guild.id, 'settings.prefix')
        await msg.channel.send(`See \`${prefix}help meep\` for help`)
    }
}

async function readHentai(channel, url, page = 1) {
    const {title, images} = await getHentaiData(url);
    if (images.length === 0) {
        channel.send('There are no images for this hentai');
        return;
    }

    let reading = true;
    let edit = false;

    const data = {
        page,
        url,
        images,
        title,
        msg: await channel.send(embedRead(page, url, images, title)),
        channel
    }

    sessions.push(data);

    while (reading) {
        if (edit) {
            await data.msg.edit(embedRead(data.page, url, images, title));
            await data.msg.reactions.removeAll();
        } else {
            edit = true;
        }

        if (images.length > 1) {
            if (data.page !== 1) await data.msg.react('⬅️');
            if (data.page !== images.length) await data.msg.react('➡️');
            try {
                const collected = await data.msg.awaitReactions(filter, {max: 1, time: 300000, errors: ['time']});
                const reaction = collected.first();
                if (reaction.emoji.name === '➡️') {
                    ++data.page;
                } else {
                    --data.page;
                }
            } catch (err) {
                await data.msg.reactions.removeAll();
                reading = false;
            }
        }
    }

    sessions.splice(sessions.indexOf(data), 1);
}

function filter(reaction, user) {
    return ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot;
}

function embedRead(page, url, images, title) {
    return new MessageEmbed()
        .setTitle(`Page ${page}/${images.length}`)
        .setURL(`${url}${page}`)
        .setImage(images[page - 1])
        .setColor('#FF69B4')
        .setFooter(title, 'https://i.imgur.com/uLAimaY.png');
}

async function gotoPage(msg, page) {
    if (page) {
        const data = [...sessions].reverse().find(data => data.channel === msg.channel);
        if (data) {
            if (page > 0 && page < data.images.length) {
                data.page = page;
                await data.msg.reactions.removeAll();
                data.msg.edit(embedRead(page, data.url, data.images, data.title));
                if (data.page !== 1) await data.msg.react('⬅️');
                if (data.page !== data.images.length) await data.msg.react('➡️');
            } else {
                await msg.channel.send('Invalid page');
            }
        } else {
            await msg.channel.send('You aren\'t reading a hentai');
        }
    } else {
        await msg.channel.send('Missing page number');
    }
}

function description() {
    return 'Hentai';
}

function help(prefix) {
    return '```apache\n' +
        `${prefix}meep [arguments]\n\n` +
        'arguments:\n' +
        '\t[none]\n' +
        '\t\tGet a random hentai\n' +
        '\tenglish\n' +
        '\t\tGet a random english hentai\n' +
        '\tread\n' +
        '\t\tRead a random hentai\n' +
        '\tread english\n' +
        '\t\tRead a random english hentai\n' +
        '\tread [url] [page number]\n' +
        '\t\tRead hentai from url with optional page number\n' +
        '\tpage [page number]\n' +
        '\t\tChange page of latest reader in channel\n' +
        '\nexamples:\n' +
        `\t${prefix}meep english\n` +
        `\t${prefix}meep read english\n` +
        `\t${prefix}meep read https://nhentai.net/g/295383/\n` +
        `\t${prefix}meep read 226730 21\n` +
        `\t${prefix}meep page 1\n` +
        '```';
}

module.exports = {
    'meep': {
        'function': meep,
        'description': description,
        'help': help,
        'group': 'nsfw',
        'permissions': 59456,
    }
};