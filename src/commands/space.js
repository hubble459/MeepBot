const database = require('../utils/database');
const {getGetString} = require('../utils/strings');

async function space(msg) {
	const getString = getGetString((msg.guild || msg.author).id);
	const spaceOn = database.get((msg.guild || msg.author).id, 'settings.space');
	database.set((msg.guild || msg.author).id, !spaceOn, 'settings.space');
	await msg.channel.send(getString('space_on').format(spaceOn ? getString('space_disabled') : getString('space_enabled')));
}

module.exports = {
	'space': {
		'function': space,
		'group': 'settings'
	}
};