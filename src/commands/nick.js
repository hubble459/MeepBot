const {getString} = require('../utils/strings');

async function nick(msg, args) {
	if (args.length !== 0) {
		try {
			const nickname = args.join(' ');
			await msg.guild.me.setNickname(nickname);
			await msg.channel.send(getString((msg.guild || msg.author).id, 'nick_changed').format(nickname));
		} catch (e) {
			await msg.channel.send(e.message);
		}
	} else {
		await msg.channel.send(getString((msg.guild || msg.author).id, 'nick_empty'));
	}
}

module.exports = {
	'nick': {
		'function': nick,
		'group': 'misc'
	},
};