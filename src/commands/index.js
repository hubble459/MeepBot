// const fs = require('fs');
//
// module.exports = [];
//
// const files = fs.readdirSync('./src/commands');
// for (let file of files) {
//     console.log(file)
//     module.exports.push(require('./' + file));
// }
//
// console.log(module.exports)

const {meep} = require('./meep');
const {ping} = require('./ping');
const {echo} = require('./echo');
const {alias} = require('./alias');
const {prefix} = require('./prefix');
const {play, stop, skip, pause, resume, queue, remove, now, repeat, shuffle} = require('./music');
const {help} = require('./help');
const {space} = require('./space');

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
    'shuffle': shuffle,
    'help': help,
    'prefix': prefix,
    'space': space,
}

async function aliasExists(msg, args) {
    if (module.exports[args[0]]) {
        await msg.channel.send('Can\'t override default command');
    } else {
        await alias(msg, args);
    }
}