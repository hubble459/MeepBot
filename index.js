const getCommands = require('./src/utils/commands');
const client = require('./src/utils/client');
const database = require('./src/utils/database');
const commands = getCommands(__filename);
const defaultAliases = require('./src/utils/default_aliases');

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await client.user.setActivity('uwu\'s', {
        type: 'LISTENING'
    });
});

function ensure(guildId) {
    const db = {};
    db.aliases = database.ensure(guildId, defaultAliases, 'aliases');
    db.music = database.ensure(guildId, {}, 'music');
    db.music.queue = database.ensure(guildId, {}, 'music.queue');
    db.music.queue.songs = database.ensure(guildId, [], 'music.queue.songs');
    db.music.queue.repeat = database.ensure(guildId, 0, 'music.queue.repeat');
    db.music.volume = database.ensure(guildId, 50, 'music.volume');
    db.music.playlists = database.ensure(guildId, {}, 'music.playlists');
    db.settings = database.ensure(guildId, {}, 'settings');
    db.settings.prefix = database.ensure(guildId, '$', 'settings.prefix');
    db.settings.space = database.ensure(guildId, false, 'settings.space');
    db.settings.ridicule = database.ensure(guildId, {}, 'settings.ridicule');
    db.settings.ridicule.on = database.ensure(guildId, true, 'settings.ridicule.on');
    db.settings.ridicule.chance = database.ensure(guildId, 100, 'settings.ridicule.chance');
    db.settings.language = database.ensure(guildId, 'english', 'settings.language');
    return db;
}

client.on('message', async msg => {
    if (msg.author.bot) return;

    const db = ensure(msg.guild.id);

    const mention = msg.mentions.users.first();
    let space = db.settings.space;
    let call;
    if (mention) {
        call = mention.id === msg.guild.me.id;
        space = true;
    }

    const canTalk = (msg.guild.me.permissionsIn(msg.channel) & 2048) === 2048;
    const content = msg.content;
    const prefix = db.settings.prefix;
    if (canTalk && (content.startsWith(db.settings.prefix + (space ? ' ' : '')) || call) && content.length > (space + prefix.length)) {
        let command = (space ? content.split(' ')[1] : content.split(' ')[0].substr(prefix.length)).toLowerCase();
        let args = content
            .split(' ')
            .slice(1 + space)
            .filter(a => a && a !== '');
        let fun = commands[command];

        while (!fun) {
            const aliasCommand = db.aliases[command];
            if (aliasCommand) {
                fun = commands[aliasCommand.command];
                args.unshift(...aliasCommand.args);
                command = aliasCommand.command;
            } else {
                break;
            }
        }

        if (fun) {
            console.log({
                server: msg.guild.name,
                command: command,
                args: args
            });

            if (fun.permissions && ((msg.guild.me.permissionsIn(msg.channel) & fun.permissions) !== fun.permissions)) {
                return msg.channel.send('Bot has insufficient permissions for this command');
            }

            try {
                await fun.function(msg, args);
            } catch (err) {
                console.error(err);
            }
        }
    } else if (canTalk && db.settings.ridicule.on && Math.floor(Math.random() * db.settings.ridicule.chance) === 0) {
        const ret = commands['retard'];
        ret.function(msg, content.split(' '));
    }
});

if (!String.prototype.format) {
    String.prototype.format = function () {
        const args = arguments;
        return this.replace(/{(\d+)}/g, (match, number) => {
            const arg = args[number];
            return arg ? arg : match;
        });
    };
}