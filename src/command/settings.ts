import { EmbedField, MessageEmbed } from "discord.js";
import { Settings } from "..";
import Category from "../model/category";
import { args, Command, ExecData } from "../model/docorators/command";
import { Music } from "../model/music";

@Command(['settings', 'setting'], Category.settings)
class SettingsCommand {
    @args()
    async showSettings({ interaction }: ExecData) {
        const settings = interaction.bot.getSettings(interaction) as Partial<Settings>;
        delete settings.id;
        const embed = new MessageEmbed()
            .setTitle('Settings')
            .setDescription(
                Object.entries(settings).map(([key, value]) => `[\`${key} = \`](http://o.w "owo")${value}`).join('\n')
            )
        await interaction.send(embed);
    }

    @args(['music'])
    async showMusicSettings({ interaction }: ExecData) {
        if (interaction.guild) {
            const settings = interaction.bot.musicPlayer.getMusic(interaction) as Partial<Music>;
            delete settings.queue;
            delete settings.seek;
            const embed = new MessageEmbed()
                .setTitle('Music Settings')
                .setDescription(
                    Object.entries(settings).map(([key, value]) => `[\`${key} = \`](http://o.w "owo")${value}`).join('\n')
                )
            await interaction.send(embed);
        }
    }

    @args(/music \w+( [\d\w]+)?/)
    async changeMusicSetting({ interaction }: ExecData) {
        const guild = interaction.guild;

        if (guild) {
            const settings = interaction.bot.musicPlayer.getMusic(interaction) as Partial<Music>;
            delete settings.queue;
            interaction.args.shift(); // <- 'music'
            const prop = interaction.args.shift() as string;
            let value: string | number = interaction.args.join(' ');
            if (settings.hasOwnProperty(prop)) {
                if (prop === 'volume') {
                    await interaction.bot.musicPlayer.setVolume(interaction, value);
                } else {
                    const current = interaction.bot.musicPlayer.musicMap.get(guild.id, prop);
                    const cType = typeof current;
                    if (cType === "number") {
                        value = Number.parseInt(value);
                    }

                    if (value && cType === typeof value) {
                        interaction.bot.musicPlayer.musicMap.set(guild.id, value, prop);
                        await interaction.send(`${prop}: \`${current}\` -> \`${value}\``);
                    } else {
                        await interaction.send('🥺')
                    }
                }
            } else {
                await interaction.send('🥺')
            }
        }
    }

    @args(['**'])
    async changeSetting({ interaction }: ExecData) {
        const settings = interaction.bot.getSettings(interaction) as Partial<Settings>;
        const id = settings.id!.slice();
        delete settings.id;
        const prop = interaction.args.shift() as string;
        let value: string | number = interaction.args.join(' ');
        if (settings.hasOwnProperty(prop)) {
            const current = settings[prop as keyof Settings];
            const cType = typeof current;
            if (cType === "number") {
                value = Number.parseInt(value);
            }

            if (value && cType === typeof value) {
                interaction.bot.settings.set(id, value, prop);
                await interaction.send(`${prop}: \`${current}\` -> \`${value}\``);
            } else {
                await interaction.send('🥺')
            }
        } else {
            await interaction.send('🥺')
        }
    }
}

export default SettingsCommand;