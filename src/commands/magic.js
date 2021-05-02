async function magic(msg, args) {
	await msg.channel.send(`
        （ ͡° ͜ʖ ͡°)つ━☆・。
⊂　　 ノ 　　　・゜+.
　しーＪ　　　°。+ ´¨)
　　　　　　　　　.· ´¸.·´¨) ¸.·*¨)
　　　　　　　　　　(¸.·´ (¸.·' ☆ ${args.join(' ')}
    `);
}

module.exports = {
	'magic': {
		'function': magic,
		'group': 'funni',
	}
};