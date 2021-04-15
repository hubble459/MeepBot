const commands = require('./src/commands');
const client = require('./src/utils/client');
const database = require('./src/utils/database');

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await client.user.setActivity('uwu\'s', {
        type: 'LISTENING'
    });
});

client.on('message', async msg => {
    if (msg.author.bot) return;

    const db = database.ensure(msg.guild.id, {
        aliases: {},
        queue: {
            songs: [],
            repeat: 0
        },
        settings: {
            prefix: '$',
            space: false
        }
    });

    const content = msg.content;
    const space = db.settings.space;
    const prefix = db.settings.prefix;
    if (content.startsWith(db.settings.prefix + (space ? ' ' : '')) && content.length > (space + prefix.length)) {
        const command = (space ? content.split(' ')[1] : content.split(' ').substr(prefix.length)).toLowerCase();
        let args = content
            .split(/[\n ]/g)
            .slice(1 + space)
            .filter(a => a && a !== '')
            .map(a => a.replace(/\n/g, ''));
        let fun = commands[command];

        if (!fun) {
            const aliasCommand = db.aliases[command];
            if (aliasCommand) {
                fun = commands[aliasCommand.command];
                args = [...aliasCommand.args, ...args];
            }
        }

        if (fun) {
            console.log('cmd: ', command);
            console.log('args: ', args);
            console.log();
            try {
                await fun(msg, args);
            } catch (err) {
                console.error(err);
            }
        }
    }
});