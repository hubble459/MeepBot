const database = require('../utils/database');

async function space(msg, args) {
    const spaceOn = database.get(msg.guild.id, 'settings.space')
    database.set(msg.guild.id, !spaceOn, 'settings.space')
    await msg.channel.send(`Space after command ${spaceOn ? 'disabled' : 'enabled'}`)
}

function help(prefix) {
    return 'owo';
}

function description() {
    return `Add a new name for a command`;
}

module.exports = {
    space,
    help,
    description
};