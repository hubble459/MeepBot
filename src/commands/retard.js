const database = require('../utils/database');
const {'echo': {'function': echo}} = require('./echo');
const {getGetString} = require('../utils/strings');

function randomBool() {
    return Math.floor(Math.random() * 2) === 0;
}

async function retard(msg, args) {
    const r = args.join(' ').split('').map(char => randomBool() ? char.toUpperCase() : char.toLowerCase()).join('');
    await echo(msg, r.split(' '));
}

module.exports = {
    'retard': {
        'function': retard,
        'group': 'funni'
    },
    'ridicule': {
        'function': async (msg, [on]) => {
            const getString = getGetString(msg.guild.id);
            if (on) {
                if (on === 'on') {
                    database.set(msg.guild.id, true, 'settings.randomRetard');
                    await msg.channel.send(getString('ridicule_on'));
                } else if (on === 'off') {
                    database.set(msg.guild.id, false, 'settings.randomRetard');
                    await msg.channel.send(getString('ridicule_off'));
                } else {
                    await msg.channel.send(getString('ridicule_bad'));
                }
            } else {
                const on = database.get(msg.guild.id, 'settings.randomRetard');
                await msg.channel.send(getString('ridicule_is').format(on ? getString('ridicule_is_on') : getString('ridicule_is_of')));
            }
        },
        'group': 'funni'
    },
};