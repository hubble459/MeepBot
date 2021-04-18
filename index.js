const getCommands = require('./src/utils/commands');
const client = require('./src/utils/client');
const database = require('./src/utils/database');
const commands = getCommands(__filename);

const aliases = {
    'np': {
        command: 'now',
        args: []
    },
    'playing': {
        command: 'now',
        args: []
    },
    'p': {
        command: 'play',
        args: []
    },
    'disconnect': {
        command: 'stop',
        args: []
    },
    'quit': {
        command: 'stop',
        args: []
    },
    'playlists': {
        command: 'playlist',
        args: []
    }
};

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await client.user.setActivity('uwu\'s', {
        type: 'LISTENING'
    });
});

client.on('message', async msg => {
    if (msg.author.bot) return;

    const db = database.ensure(msg.guild.id, {
        aliases: aliases,
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
            space: false
        }
    });

    const canTalk = (msg.guild.me.permissions & 2048) === 2048;
    const content = msg.content;
    const space = db.settings.space;
    const prefix = db.settings.prefix;
    if (canTalk && content.startsWith(db.settings.prefix + (space ? ' ' : '')) && content.length > (space + prefix.length)) {
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
    }
});