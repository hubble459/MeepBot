const svg2img = require('svg2img');
const {MessageAttachment} = require('discord.js');
const {getGetString} = require('../utils/strings');
const wikiJs = require('../utils/wiki/wiki');

async function wiki(msg, args) {
	const getString = getGetString(msg.guild.id);
	if (args.length > 0) {
		const query = args.join(' ');
		try {
			const wikiObj = wikiJs({
				apiUrl: `https://${getString('wiki_lang')}.wikipedia.org/w/api.php`,
				origin: '*',
				headers: {
					'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0'
				}
			});
			const res = (await wikiObj.search(query, 1)).results[0];
			if (res) {
				const page = await wikiObj.page(res);
				const summary = await page.summary();
				const image = await page.mainImage();
				await msg.channel.send(
					'```' + summary.slice(0, 1991) + (summary.length > 1991 ? '...' : '') + '```',
					new MessageAttachment(await svgToPng(image))
				);
			} else {
				await msg.channel.send(getString('wiki_no_results').format(query));
			}
		} catch (e) {
			await msg.channel.send(e.message);
		}
	} else {
		await msg.channel.send(getString('wiki_need_term'));
	}
}

async function svgToPng(url) {
	return new Promise((resolve, reject) => {
		if (url.endsWith('.svg')) {
			svg2img(url, (error, buffer) => {
				if (!error) {
					resolve(buffer);
				} else {
					reject(error);
				}
			});
		} else {
			resolve(url);
		}
	});
}

module.exports = {
	'wiki': {
		'function': wiki,
		'group': 'misc',
	},
};