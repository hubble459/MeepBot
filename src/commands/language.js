const database = require('../utils/database');
const {find, getString} = require('../utils/strings');
const {MessageAttachment} = require('discord.js');
const tsundereLink = 'https://dogtrainingobedienceschool.com/pic/257821_full-tsundere-tumblr-quotes-shoujo-tsundere-tumblr.jpg';
const tsundereAttachment = new MessageAttachment(tsundereLink);

async function language(msg, [lang]) {
    if (!lang) {
        const locale = database.get(msg.guild.id, 'settings.language');

        if ('tsundere'.startsWith(locale) && (msg.guild.me.permissionsIn(msg.channel) & 32768) === 32768) {
            await msg.channel.send(tsundereAttachment);
        } else {
            const string = getString(msg.guild.id, 'language_current');
            await msg.channel.send(string.format(locale));
        }
    } else {
        lang = find(lang);
        if (lang) {
            database.set(msg.guild.id, lang, 'settings.language');
            const string = getString(msg.guild.id, 'language_changed');
            await msg.channel.send(string.format(lang));
        } else {
            const string = getString(msg.guild.id, 'language_not_found').format(lang);
            await msg.channel.send(string.format(lang));
        }
    }
}

module.exports = {
    'language': {
        'function': language,
        'group': 'settings',
    }
};