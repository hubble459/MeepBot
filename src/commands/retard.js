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
};