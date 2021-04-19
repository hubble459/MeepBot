const database = require('../utils/database');
const strings = require('../utils/strings');

async function language(msg, [lang]) {
    const locale = database.get(msg.guild.id, 'settings.language');
    if (!lang) {
        const string = strings.getString(locale, 'language_current');
        await msg.channel.send(string.format(locale));
    } else {
        lang = strings.find(lang);
        if (lang) {
            database.set(msg.guild.id, lang, 'settings.language');
            const string = strings.getString(lang, 'language_changed');
            await msg.channel.send(string.format(lang));
        } else {
            const string = strings.getString(locale, 'language_not_found');
            await msg.channel.send(string.format(lang));
        }
    }
}

function description() {
    return 'Change the bot language for this server';
}

function help() {
    return `empty uwu`;
}

module.exports = {
    'language': {
        'function': language,
        'description': description,
        'help': help,
        'group': 'misc',
    }
};