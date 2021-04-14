async function echo(msg, args) {
    await msg.channel.send(args.join(' '));
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