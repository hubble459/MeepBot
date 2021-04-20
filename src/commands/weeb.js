const fetch = require('node-fetch');
const {MessageAttachment} = require('discord.js');

async function weeb(msg) {
    let notFound = true;
    let link = 'https://cdn.awwni.me/n${random}.jpg';
    while (notFound) {
        const random = Array(3).fill(0).map(() => {
            const r = Math.floor(Math.random() * 36);
            return r > 26 ? r : String.fromCharCode(r + 97);
        }).join('');
        link = `https://cdn.awwni.me/n${random}.jpg`;
        const res = await fetch(link, {method: 'HEAD'});
        notFound = !res.ok;
    }
    await msg.channel.send(new MessageAttachment(link));
}

module.exports = {
    'weeb': {
        'function': weeb,
        'group': 'misc',
    }
};