const {getGetString} = require('../utils/strings');
const fetch = require('node-fetch');
const {MessageEmbed} = require('discord.js');

async function urban(msg, args) {
    const getString = getGetString(msg.guild.id);
    if (args.length > 0) {
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '91b266dfa9msh358f1f0227c9f96p16b516jsn9ec80aa3f69a',
                'x-rapidapi-host': 'mashape-community-urban-dictionary.p.rapidapi.com'
            }
        };

        const url = 'https://mashape-community-urban-dictionary.p.rapidapi.com/define?term=' + args.join(' ');

        const response = await fetch(url, options);
        const json = await response.json();
        const result = json.list[0];

        if (result) {
            const embed = new MessageEmbed()
                .setTitle(result['word'])
                .setColor('#1d2439')
                .setDescription(result['definition'].replace(/`/g, `'`))
                .addField('Example:', result['example'].replace(/`/g, `'`))

            await msg.channel.send(embed);
        } else {
            await msg.channel.send(getString('urban_not_found').format(args.join(' ')));
        }
    } else {
        await msg.channel.send(getString('urban_need_term'));
    }
}

module.exports = {
    'urban': {
        'function': urban,
        'group': 'misc',
    },
};