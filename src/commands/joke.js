const fetch = require('node-fetch');

async function joke(msg) {
	const res = await fetch('https://v2.jokeapi.dev/joke/Any');
	const json = await res.json();

	if (!json.error) {
		if (json.type === 'single') {
			await msg.channel.send(json['joke']);
		} else if (json.type === 'twopart') {
			await msg.channel.send(
				json['setup'] + '\n\n' +
				'||' + json['delivery'] + '||'
			);
		}
	}
}

module.exports = {
	'joke': {
		'function': joke,
		'group': 'misc',
	},
};