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

client.on('message', async msg => {
    if (msg.author.bot) return;

    const db = database.ensure(msg.guild.id, {
        aliases: defaultAliases,
        music: {
            queue: {
                songs: [],
                repeat: 0
            },
            volume: 100,
            playlists: {}
        },
        settings: {
            prefix: '$',
            space: false,
            randomRetard: true,
            language: 'en'
        }
    });

    const mention = msg.mentions.users.first();
    let space = db.settings.space;
    let call;
    if (mention) {
        call = mention.id === msg.guild.me.id;
        space = true;
    }

    const canTalk = (msg.guild.me.permissions & 2048) === 2048;
    const randomRetard = db.settings.randomRetard;
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
            console.log('cmd: ', command);
            console.log('args: ', args);
            console.log();

            if (fun.permissions && ((msg.guild.me.permissions & fun.permissions) !== fun.permissions)) {
                return msg.channel.send('Bot has insufficient permissions for this command');
            }

            try {
                await fun.function(msg, args);
            } catch (err) {
                console.error(err);
            }
        }
    } else if (canTalk && randomRetard && Math.floor(Math.random() * 100) === 0) {
        const ret = commands['retard'];
        ret.function(msg, content.split(' '));
    }
});

if (!String.prototype.format) {
    String.prototype.format = function () {
        const args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}