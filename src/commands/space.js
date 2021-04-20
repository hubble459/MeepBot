const database = require('../utils/database');
const {getGetString} = require('../utils/strings');

async function space(msg) {
    const getString = getGetString(msg.guild.id);
    const spaceOn = database.get(msg.guild.id, 'settings.space');
    database.set(msg.guild.id, !spaceOn, 'settings.space');
    await msg.channel.send(getString('space_on').format(spaceOn ? getString('space_disabled') : getString('space_enabled')));
}

module.exports = {
    'space': {
        'function': space,
        'group': 'settings'
    }
};