const fetch = require('node-fetch');
const {MessageEmbed} = require('discord.js');
const {openWeatherMap} = require('../utils/config');
const {getString} = require('../utils/strings');

async function weather(msg, args) {
    if (args.length > 0) {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=metric&appid=${openWeatherMap}&q=${args.join(' ')}`);
        const json = await res.json();

        if (res.ok) {
            const weather = json['weather'][0] || {main: 'Unknown', description: ''};
            const embed = new MessageEmbed()
                .setTitle(`The weather 🌦 in **${json.name}**`)
                .setColor('#93fcef')
                .setDescription(weather.main + ' (' + weather.description +')')
                .addField('Temperature(°C):', json.main['temp'])
                .addField('Humidity:', json.main['humidity'])
                .addField('Cloudiness:', json['clouds']['all']);
            await msg.channel.send(embed);
        } else {
            await msg.channel.send(json.message);
        }
    } else {
        await msg.channel.send(getString(msg.guild.id, 'weather_missing_city'));
    }
}

module.exports = {
    'weather': {
        'function': weather,
        'group': 'misc',
    },
};