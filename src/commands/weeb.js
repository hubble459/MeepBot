const fetch = require('node-fetch');
const {MessageAttachment} = require('discord.js');
const {getString} = require('../utils/strings');

async function weeb(msg, args) {
    args.unshift('-source:twitter.com');

    const url = 'https://danbooru.donmai.us/posts/random?tags=' + args.join(' ');
    console.log(url);

    const retries = 3;
    for (let i = 0; i < retries; i++) {
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
                        break;
                    }
                } catch (e) {
                    await msg.channel.send(e.message);
                    break;
                }
            }
        } else {
            const str = getString(msg.guild.id, 'weeb_bad_tag');
            await msg.channel.send(str);
            break;
        }
        if (i === retries - 1) {
            await msg.channel.send(getString(msg.guild.id, 'weeb_not_found'));
        }
    }
}

module.exports = {
    'weeb': {
        'function': weeb,
        'group': 'misc',
    }
};