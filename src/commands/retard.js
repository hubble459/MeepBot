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
        'function': async (msg, [command, on]) => {
            const getString = getGetString(msg.guild.id);
            if (command === 'turn') {
                if (on) {
                    if (on === 'on') {
                        database.set(msg.guild.id, true, 'settings.ridicule.on');
                        await msg.channel.send(getString('ridicule_on'));
                    } else if (on === 'off') {
                        database.set(msg.guild.id, false, 'settings.ridicule.on');
                        await msg.channel.send(getString('ridicule_off'));
                    } else {
                        await msg.channel.send(getString('ridicule_bad'));
                    }
                } else {
                    const on = database.get(msg.guild.id, 'settings.ridicule.on');
                    await msg.channel.send(getString('ridicule_is').format(on ? getString('ridicule_is_on') : getString('ridicule_is_of')));
                }
            } else if (command === 'chance') {
                if (on) {
                    const chance = +on;
                    if (!isNaN(chance) && chance > 0) {
                        database.set(msg.guild.id, chance, 'settings.ridicule.chance');
                        await msg.channel.send(getString('ridicule_change').format(chance));
                    } else {
                        await msg.channel.send(getString('ridicule_change_bad').format(on));
                    }
                } else {
                    const chance = database.get(msg.guild.id, 'settings.ridicule.chance');
                    await msg.channel.send(getString('ridicule_chance_is').format(chance));
                }
            } else {
                await msg.channel.send(getString('ridicule_bad_two'));
            }
        },
        'group': 'funni'
    },
};