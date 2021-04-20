const database = require('../utils/database');
const strings = require('../utils/strings');

async function language(msg, [lang]) {
    if (!lang) {
        const locale = database.get(msg.guild.id, 'settings.language');
        const string = strings.getString(msg.guild.id, 'language_current');
        await msg.channel.send(string.format(locale));
    } else {
        lang = strings.find(lang);
        if (lang) {
            database.set(msg.guild.id, lang, 'settings.language');
            const string = strings.getString(msg.guild.id, 'language_changed');
            await msg.channel.send(string.format(lang));
        } else {
            const string = strings.getString(msg.guild.id, 'language_not_found');
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