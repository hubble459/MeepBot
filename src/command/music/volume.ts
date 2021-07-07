import { VoiceConnection } from "discord.js";
import Category from "../../model/category";
import { args, Command, ExecData } from "../../model/docorators/command";

@Command(['volume', 'v'], Category.music)
class Volume {
    @args(/\d/, 'volume', 'change the volume', true)
    async exec({ interaction }: ExecData) {
        const volume = Number.parseInt(interaction.args[0] as string);
        const member = interaction.member;
        const guild = interaction.guild;
        if (member && guild) {
            let botVcConn: null | VoiceConnection = null;
            if (guild.voice) {
                botVcConn = guild.voice.connection;
            }
            if (botVcConn) {
                const vc = member.voice.channel;
                if (vc) {
                    if (vc.id === botVcConn.channel.id) {
                        await interaction.bot.musicPlayer.setVolume(interaction, volume);
                    } else {
                        await interaction.send('not in same vc uwu');
                    }
                } else {
                    await interaction.send('not in a vc uwu');
                }
            } else {
                await interaction.bot.musicPlayer.setVolume(interaction, volume);
            }
        }
    }
}

export default Volume;