const commands = require('./src/commands');
const client = require('./src/utils/client');
const {prefix} = require('./src/utils/config');

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await client.user.setActivity(prefix, {
        type: 'LISTENING'
    });
});

client.on('message', async msg => {
    if (msg.author.bot) return;

    const content = msg.content;
    if (content.startsWith(prefix) && content.length > 1) {
        const command = content.split(' ')[0].substr(1);
        let args = content
            .split(/[\n ]/g)
            .slice(1)
            .filter(a => a && a !== '')
            .map(a => a.replace(/\n/g, ''));
        let fun = commands[command];

        if (!fun) {
            const aliasCommand = (commands.getAliasses(msg.guild.id) || {})[command];
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

process.on('exit', (code) => {
    if (code === 0) {
        // const voiceChannels = client.channels.cache.filter(ch => ch.type === 'voice');
        // console.log();
    }

    return console.log(`Exiting with code ${code}`)
})

process.on('SIGINT', () => {
    process.exit();
});