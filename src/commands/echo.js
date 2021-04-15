async function echo(msg, args) {
    const message = args.join(' ');
    if (message.length === 0) {
        await msg.channel.send('Can\'t echo an empty message');
    } else {
        await msg.channel.send(message);
    }
}

function description() {
    return 'Make me say lewd stuff :3';
}

function help(prefix) {
    return `Use \`${prefix}echo <words>\` eg. \`${prefix}echo I'm so adowable uwu\``;
}

module.exports = {
    echo,
    description,
    help
}