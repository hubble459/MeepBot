const fs = require('fs');

function getCommands(...not) {
	const commands = {};
	const files = fs.readdirSync('./src/commands');
	for (let file of files) {
		if (!not.includes(file.split('.')[0])) {
			const exports = require('../commands/' + file);
			for (let command in exports) {
				if (exports.hasOwnProperty(command)) {
					commands[command] = exports[command];
				}
			}
		}
	}
	return commands;
}

module.exports = getCommands;