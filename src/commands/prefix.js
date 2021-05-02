const database = require('../utils/database');
const {getGetString} = require('../utils/strings');

async function prefix(msg, args) {
	const getString = getGetString((msg.guild || msg.author).id);
	if (args.length > 0) {
		const prefix = args.join(' ');
		database.set((msg.guild || msg.author).id, prefix, 'settings.prefix');
		await msg.channel.send(getString('prefix_changed').format(prefix));
	} else {
		await msg.channel.send(getString('prefix_current').format(database.get((msg.guild || msg.author).id, 'settings.prefix')));
	}
}

module.exports = {
	'prefix': {
		'function': prefix,
		'group': 'settings'
	}
};