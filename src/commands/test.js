async function test(msg, [wanted]) {
    await msg.channel.send('perms: \n' + ((msg.guild.me.permissions & +wanted) === +wanted));
}

function description() {
    return 'Command for testing things';
}

function help() {
    return `Don't use me.. 😳 im for my master only`;
}

module.exports = {
    'test': {
        'function': test,
        'description': description,
        'help': help,
        'group': 'misc',
        'permissions': 8
    }
};