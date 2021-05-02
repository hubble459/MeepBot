const database = require('../utils/database');
const {getString} = require('../utils/strings');
const {MessageEmbed} = require('discord.js');
const {regex, getRandomHentai, getHentaiData} = require('../utils/nhentai');
const sessions = [];

async function meep(msg, args) {
	const arg = args[0];
	if (!arg) {
		await msg.channel.send(await getRandomHentai());
	} else if (arg === 'english') {
		await msg.channel.send(await getRandomHentai(true));
	} else if (arg === 'page') {
		await gotoPage(msg, args[1]);
	} else if (arg === 'read') {
		let url = args[1];
		if (url && /^\d+$/.test(url)) {
			url = `https://nhentai.net/g/${url}/`;
		}
		const validUrl = !!url && regex.test(url);
		const page = args[2] || 1;
		await readHentai(msg, validUrl ? url : await getRandomHentai(url === 'english'), validUrl ? page : 1);
	} else {
		const prefix = database.get(msg.guild.id, 'settings.prefix');
		await msg.channel.send(getString(msg.guild.id, 'meep_see_help').format(prefix));
	}
}

async function readHentai(msg, url, page = 1) {
	const {title, images} = await getHentaiData(url);
	if (images.length === 0) {
		return msg.channel.send(getString(msg.guild.id, 'meep_no_images'));
	}

	let reading = true;
	let edit = false;

	const data = {
		page,
		url,
		images,
		title,
		msg: await msg.channel.send(embedRead(page, url, images, title)),
		channel: msg.channel
	};

	sessions.push(data);

	while (reading) {
		if (edit) {
			await data.msg.edit(embedRead(data.page, url, images, title));
			await data.msg.reactions.removeAll();
		} else {
			edit = true;
		}

		if (images.length > 1) {
			if (data.page !== 1) await data.msg.react('⬅️');
			if (data.page !== images.length) await data.msg.react('➡️');
			try {
				const collected = await data.msg.awaitReactions(filter, {max: 1, time: 300000, errors: ['time']});
				const reaction = collected.first();
				if (reaction.emoji.name === '➡️') {
					++data.page;
				} else {
					--data.page;
				}
			} catch (err) {
				await data.msg.reactions.removeAll();
				reading = false;
			}
		}
	}

	sessions.splice(sessions.indexOf(data), 1);
}

function filter(reaction, user) {
	return ['⬅️', '➡️'].includes(reaction.emoji.name) && !user.bot;
}

function embedRead(page, url, images, title) {
	return new MessageEmbed()
		.setTitle(`Page ${page}/${images.length}`)
		.setURL(`${url}${page}`)
		.setImage(images[page - 1])
		.setColor('#FF69B4')
		.setFooter(title, 'https://i.imgur.com/uLAimaY.png');
}

async function gotoPage(msg, page) {
	if (page) {
		const data = [...sessions].reverse().find(data => data.channel === msg.channel);
		if (data) {
			if (page > 0 && page < data.images.length) {
				data.page = page;
				await data.msg.reactions.removeAll();
				data.msg.edit(embedRead(page, data.url, data.images, data.title));
				if (data.page !== 1) await data.msg.react('⬅️');
				if (data.page !== data.images.length) await data.msg.react('➡️');
			} else {
				await msg.channel.send(getString(msg.guild.id, 'meep_invalid_page'));
			}
		} else {
			await msg.channel.send(getString(msg.guild.id, 'meep_not_reading'));
		}
	} else {
		await msg.channel.send(getString(msg.guild.id, 'meep_missing_page'));
	}
}

module.exports = {
	'meep': {
		'function': meep,
		'group': 'nsfw',
		'permissions': 59456,
	}
};