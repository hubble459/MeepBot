const database = require('../utils/database');
const getCommands = require('../utils/commands');
const defaultAliases = require('../utils/default_aliases');
const commands = getCommands(__filename, 'help');
const {MessageEmbed} = require('discord.js');
const {getGetString} = require('../utils/strings');

async function alias(msg, msgArgs) {
	const getString = getGetString(msg.guild.id);
	const newCommand = msgArgs[0];
	if (msgArgs.length > 1) {
		if (commands[newCommand] || newCommand === 'help') {
			await msg.channel.send(getString('alias_override'));
		} else if (newCommand.startsWith(database.get(msg.guild.id, 'settings.prefix'))) {
			await msg.channel.send(getString('alias_prefix'));
		} else {
			let command = msgArgs[1];
			if (!commands[command] && !database.has(msg.guild.id, `aliases.${command}`) && command !== 'help') {
				return msg.channel.send(getString('alias_not_command').format(command));
			}
			const args = msgArgs.slice(2);

			const existed = database.has(msg.guild.id, `aliases.${newCommand}`);
			database.set(msg.guild.id, {
				command,
				args
			}, `aliases.${newCommand}`);
			await msg.channel.send(getString('alias_add').format(newCommand, existed ? getString('alias_add_changed') : getString('alias_add_added')));
		}
	} else {
		await msg.channel.send(getString('alias_arguments'));
	}
}

const aliasrm = {
	'function': async (msg, [alias]) => {
		const getString = getGetString(msg.guild.id);
		if (alias) {
			const exists = database.has(msg.guild.id, `aliases.${alias}`);
			if (exists) {
				database.delete(msg.guild.id, `aliases.${alias}`);
				await msg.channel.send(getString('aliasrm_removed').format(alias));
			} else {
				await msg.channel.send(getString('aliasrm_find').format(alias));
			}
		} else {
			await msg.channel.send(getString('aliasrm_arguments'));
		}
	},
	'group': 'misc'
};

const aliases = {
	'function': async (msg, [arg1]) => {
		const getString = getGetString(msg.guild.id);

		if (arg1 === 'reset') {
			database.set(msg.guild.id, defaultAliases, 'aliases');
			await msg.channel.send(getString('aliases_reset'));
		} else {
			const aliases = database.get(msg.guild.id, 'aliases');
			const values = [];

			const entries = Object.entries(aliases);
			const size = entries.length;
			entries
				.slice(0, 20)
				.forEach(([alias, {args, command}]) => {
					args = args.join(' ');
					args = args.slice(0, 20) + (args.length > 20 ? '...' : '');
					values.push(`${alias} -> ${command} ${args}`);
				});

			const embed = new MessageEmbed()
				.addField(`${size} alias${size !== 0 ? 'es' : ''}`, '```apache\n' + values.join('\n') + '```');
			await msg.channel.send(embed);
		}
	},
	'group': 'misc'
};

module.exports = {
	'alias': {
		'function': alias,
		'group': 'misc'
	},
	aliasrm,
	aliases,
};