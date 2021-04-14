const {meep} = require('./meep');
const {ping} = require('./ping');
const {echo} = require('./echo');
const {alias, getAliasses} = require('./alias');
const {play, stop, skip, pause, resume, queue, remove, now, repeat} = require('./music');
const {help} = require('./help');

module.exports = {
    'meep': meep,
    'ping': ping,
    'echo': echo,
    'alias': aliasExists,
    'play': play,
    'stop': stop,
    'skip': skip,
    'pause': pause,
    'resume': resume,
    'queue': queue,
    'remove': remove,
    'clear': (msg) => remove(msg, ['all']),
    'now': now,
    'repeat': repeat,
    'help': help,
    getAliasses
}

async function aliasExists(msg, args) {
    if (module.exports[args[0]]) {
        await msg.channel.send('Can\'t override default command');
    } else {
        await alias(msg, args);
    }
}