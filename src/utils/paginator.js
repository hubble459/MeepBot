const {MessageEmbed} = require('discord.js');

module.exports = async function (channel, allItems, itemsPerPage, onNewPage, ...listeners) {
    if (!channel || !Array.isArray(allItems) || isNaN(itemsPerPage) || itemsPerPage < 1 || !onNewPage) return;
    const emojis = ['⬅️', '➡️', '❌'];
    for (const listener of listeners) {
        if (!listener.emoji || !listener.callback) {
            return;
        } else {
            emojis.push(listener.emoji);
        }
    }

    let msg = await channel.send(new MessageEmbed().setTitle('loading...'));

    const pages = Math.ceil(allItems / itemsPerPage);
    let page = 0;
    while (true) {
        const items = allItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
        await msg.reactions.removeAll();
        await onNewPage(msg, items, page);
        try {
            if (page !== 0) await msg.react('⬅️');
            if (page !== pages - 1) await msg.react('➡️');
            await msg.react('❌');
            for (const l of listeners) {
                await msg.react(l.emoji);
            }
            const reaction = (await msg.awaitReactions((r, u) => filter(emojis, r, u), {
                max: 1,
                time: 300000,
                errors: ['time']
            })).first();
            const listener = listeners.find(({emoji}) => emoji === reaction.emoji.name);
            if (listener) {
                msg = await listener.callback(msg, items, page);
            } else {
                if (reaction.emoji.name === '❌') {
                    await msg.reactions.removeAll();
                    return;
                }
                page += (reaction.emoji.name === '➡️' ? 1 : -1);
                if (page >= pages) {
                    page--;
                } else if (page < 0) {
                    page++;
                }
            }
        } catch (err) {
            await msg.reactions.removeAll();
            return;
        }
    }
};

function filter(emojis, reaction, user) {
    return emojis.includes(reaction.emoji.name) && !user.bot;
}