const fetch = require('node-fetch');

async function insult(msg) {
	try {
		const res = await fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json');
		const json = await res.json();

		if (res.ok) {
			const insult = json['insult'].replace(/&quot;/g, '\'');
			await msg.channel.send(insult);
		} else {
			await msg.channel.send(json.message);
		}
	} catch (e) {
		await msg.channel.send(e.message);
	}
}

module.exports = {
	'insult': {
		'function': insult,
		'group': 'misc',
	},
};