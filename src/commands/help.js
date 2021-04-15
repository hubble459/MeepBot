const database = require('../utils/database');
const meep = require('./meep');
const ping = require('./ping');
const echo = require('./echo');
const alias = require('./alias');
const prefix = require('./prefix');
const {play_, stop_, skip_, pause_, resume_, queue_, remove_, now_, repeat_, shuffle_} = require('./music');

const commands = {
    '_Use $help <command> for more information\n': {},
    '_Basic:': {},
    'help': {description, help: info},
    'meep': {description: meep.description, help: meep.help},
    'ping': {description: ping.description, help: ping.help},
    'echo': {description: echo.description, help: echo.help},
    '_\nMusic:': {},
    'play': {description: play_.description, help: play_.help},
    'stop': {description: stop_.description, help: stop_.help},
    'skip': {description: skip_.description, help: skip_.help},
    'pause': {description: pause_.description, help: pause_.help},
    'resume': {description: resume_.description, help: resume_.help},
    'queue': {description: queue_.description, help: queue_.help},
    'remove': {description: remove_.description, help: remove_.help},
    'clear': {description: () => 'Clear the queue', help: (prefix) => `eg: \`${prefix}clear\``},
    'now': {description: now_.description, help: now_.help},
    'repeat': {description: repeat_.description, help: repeat_.help},
    'shuffle': {description: shuffle_.description, help: shuffle_.help},
    '_\nMisc:': {},
    'alias': {description: alias.description, help: alias.help},
    'prefix': {description: prefix.description, help: prefix.help},
}

async function help(msg, args) {
    const prefix = database.get(msg.guild.id, 'settings.prefix');
    if (args[0]) {
        const command = args[0];
        const funs = commands[command];
        if (funs) {
            await msg.channel.send(funs.help(prefix));
        } else {
            await msg.channel.send(`Command \`${command}\` not found`);
        }
    } else {
        await msg.channel.send(
            '```apache\n' +
            Object
                .entries(commands)
                .map(([command, value]) => command.startsWith('_') ? command.substr(1) : `${prefix}${command} ${value.description()}`)
                .join('\n') +
            '```'
        );
    }
}

function description() {
    return 'This menu';
}

function info() {
    return 'Use `help <command>` to get more information about a command\nOr just `help` to show the help menu';
}

module.exports = {help};