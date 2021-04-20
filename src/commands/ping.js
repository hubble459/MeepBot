const {getGetString} = require('../utils/strings');

async function ping(msg) {
    const getString = getGetString(msg.guild.id);
    const before = Date.now();
    msg = await msg.channel.send(getString('ping_pong'));
    const diff = Date.now() - before;
    await msg.edit(getString('ping_diff').format(diff, Math.floor(diff / 2)));
}

module.exports = {
    'ping': {
        'function': ping,
        'group': 'misc'
    }
};