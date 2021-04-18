async function magic(msg, args) {
    await msg.channel.send(`
        （ ͡° ͜ʖ ͡°)つ━☆・。
⊂　　 ノ 　　　・゜+.
　しーＪ　　　°。+ ´¨)
　　　　　　　　　.· ´¸.·´¨) ¸.·*¨)
　　　　　　　　　　(¸.·´ (¸.·' ☆ ${args.join(' ')}
    `);
}

function description() {
    return 'Magical echo';
}

function help(prefix) {
    return `see ${prefix}help echo`;
}

module.exports = {
    'magic': {
        'function': magic,
        'description': description,
        'help': help,
        'group': 'misc',
    }
};