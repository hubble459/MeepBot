async function nick(msg, args) {
    if (args.length !== 0) {
        try {
            const nickname = args.join(' ');
            await msg.guild.me.setNickname(nickname);
            await msg.channel.send(`Nickname changed to **${nickname}**`);
        } catch (e) {
            await msg.channel.send(e.message);
        }
    } else {
        await msg.channel.send(`Nickname cannot be empty`);
    }
}

function help(prefix) {
    return '```apache\n' +
        `${prefix}nick [nickname]\n` +
        `Examples:\n` +
        `\t${prefix}nick slut\n` +
        `\t${prefix}nick i love writing code in javascript\n` +
        '```';
}

function description() {
    return `echo but more funni`;
}

module.exports = {
    'nick': {
        'function': nick,
        'description': description,
        'help': help,
        'group': 'misc'
    },
};