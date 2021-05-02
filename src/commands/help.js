const {MessageEmbed} = require('discord.js');
const database = require('../utils/database');
const strings = require('../utils/strings');
const getCommands = require('../utils/commands');
const commands = getCommands(__filename);

const groups = {};
for (const [name, cmd] of Object.entries(commands)) {
	cmd.name = name;
	if (!groups[cmd.group || 'misc']) {
		groups[cmd.group || 'misc'] = [];
	}
	groups[cmd.group || 'misc'].push(cmd);
}

async function help(msg, [command]) {
	const prefix = database.get((msg.guild || msg.author).id, 'settings.prefix') + (database.get((msg.guild || msg.author).id, 'settings.space') ? ' ' : '');
	if (command) {
		let cmd = commands[command] || command === 'help';

		while (!cmd) {
			const aliasCommand = database.get((msg.guild || msg.author).id, `aliases.${command}`);
			if (aliasCommand) {
				cmd = commands[aliasCommand.command];
				command = aliasCommand.command;
			} else {
				break;
			}
		}

		if (cmd) {
			const embed = new MessageEmbed()
				.setTitle(command)
				.addField(
					strings.getString((msg.guild || msg.author).id, `${command}_description`),
					'```apache\n' +
					strings.getString((msg.guild || msg.author).id, `${command}_help`).format(prefix) +
					'```');

			await msg.channel.send(embed);
		} else {
			await msg.channel.send(`Command \`${command}\` not found`);
		}
	} else {
		const fields = [];
		for (const [group, commands] of Object.entries(groups)) {
			const body =
				'```apache\n' +
				commands
					.map(command => `${prefix}${command.name}`)
					.join('\n') +
				'```';

			fields.push({name: group, value: body, inline: true});
		}

		const embed = new MessageEmbed()
			.setTitle('help')
			.addFields(...fields)
			.setDescription(`use \`${prefix}help [command]\` for more info`)
			.setTimestamp();

		await msg.channel.send(embed);
	}
}

module.exports = {
	'help': {
		'function': help,
		'group': 'misc',
	}
};