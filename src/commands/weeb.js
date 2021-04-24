const fetch = require('node-fetch');
const {MessageAttachment} = require('discord.js');
const {getGetString} = require('../utils/strings');

async function weeb(msg, args) {
    const getString = getGetString(msg.guild.id);
    // args.unshift('-source:twitter.com');
    if (args.length > 2) {
        return msg.channel.send(getString('weeb_too_many_tags'));
    }

    const url = 'https://danbooru.donmai.us/posts/random?tags=' + args.join('%20');

    const response = await fetch(url, {method: 'GET', headers: {Accept: 'application/json'}});
    const json = await response.json();
    if (response.ok && json.success !== false) {
        const link = json['large_file_url'] || json['source'];
        if (link.startsWith('http')) {
            try {
                const res = await fetch(link);
                if (res.ok) {
                    console.log(link);
                    await msg.channel.send(new MessageAttachment(link));
                }
            } catch (e) {
                await msg.channel.send(e.message);
            }
        }
    } else {
        await msg.channel.send(getString('weeb_not_found'));
    }
}

module.exports = {
    'weeb': {
        'function': weeb,
        'group': 'misc',
    }
};