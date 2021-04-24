const {getGetString} = require('../utils/strings');

async function ping(msg) {
    const getString = getGetString(msg.guild.id);

    msg = await msg.channel.send(getString('ping_pong'));
    const diff = Date.now() - msg.createdTimestamp;
    await msg.edit(getString('ping_diff').format(diff));
}

module.exports = {
    'ping': {
        'function': ping,
        'group': 'misc'
    }
};