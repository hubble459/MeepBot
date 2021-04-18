const database = require('../utils/database');
const {'echo': {'function': echo}} = require('./echo');

function randomBool() {
    return Math.floor(Math.random() * 2) === 0;
}

async function retard(msg, args) {
    const r = args.join(' ').split('').map(char => randomBool() ? char.toUpperCase() : char.toLowerCase()).join('');
    await echo(msg, r.split(' '));
}

function help(prefix) {
    return '```apache\n' +
        `${prefix}retard [words]\n` +
        `Examples:\n` +
        `\t${prefix}retard fuck my ass\n` +
        `\t${prefix}retard i love writing code in javascript\n` +
        '```';
}

function description() {
    return `echo but more funni`;
}

module.exports = {
    'retard': {
        'function': retard,
        'description': description,
        'help': help,
        'group': 'funni'
    },
    'ridicule': {
        'function': async (msg, [on]) => {
            if (on) {
                if (on === 'on') {
                    database.set(msg.guild.id, true, 'settings.randomRetard');
                    await msg.channel.send('Ridicule turned **on**');
                } else if (on === 'off') {
                    database.set(msg.guild.id, false, 'settings.randomRetard');
                    await msg.channel.send('Ridicule turned **off**');
                } else {
                    await msg.channel.send('Bad argument');
                }
            } else {
                const on = database.get(msg.guild.id, 'settings.randomRetard');
                await msg.channel.send('Ridicule is **' + (on ? 'on' : 'off') + '**');
            }
        },
        'description': () => '1 in 100 chance to get ridiculed',
        'help': (prefix) => {
            return '```apache\n' +
                `${prefix}ridicule [on|off]\n` +
                `Examples:\n` +
                `\t${prefix}ridicule on\n` +
                `\t${prefix}ridicule off\n` +
                '```';
        },
        'group': 'funni'
    },
};