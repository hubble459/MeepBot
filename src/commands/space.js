const database = require('../utils/database');

async function space(msg) {
    const spaceOn = database.get(msg.guild.id, 'settings.space')
    database.set(msg.guild.id, !spaceOn, 'settings.space')
    await msg.channel.send(`Space after command ${spaceOn ? 'disabled' : 'enabled'}`)
}

function help(prefix) {
    return '```apache\n' +
        `${prefix}space\n` +
        'Example:\n' +
        `\t${prefix}space` +
        '```';
}

function description() {
    return 'Toggle the space after the prefix on or off';
}

module.exports = {
    'space': {
        'function': space,
        'description': description,
        'help': help,
        'group': 'settings',
    }
};