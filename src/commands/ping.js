async function ping(msg) {
    const before = Date.now();
    msg = await msg.channel.send('Pong!');
    const diff = Date.now() - before;
    await msg.edit(
        'Pong!\n```apache\n' +
        `Roundtrip: ${diff} ms\n` +
        `Time: ${Math.floor(diff / 2)} ms` +
        '```');
}

function description() {
    return 'Round trip time in ms';
}

function help(prefix) {
    return `\`${prefix}ping\``;
}

module.exports = {
    'ping': {
        'function': ping,
        'description': description,
        'help': help,
        'group': 'misc'
    }
};