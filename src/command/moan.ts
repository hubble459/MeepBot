import Category from "../model/category";
import { args, Command, ExecData, message } from "../model/docorators/command";
import MessageInteractionEvent from "../model/interaction/message_interaction_event";
import SlashInteractionEvent from "../model/interaction/slash_interaction_event";
import Moan from "../plugin/moan";

@Command('moan', Category.nsfw)
class MoanCommand {
    @args(['stop'])
    async stopMoaning({ interaction }: ExecData) {
        const key = this.key(interaction);
        if (key) {            
            interaction.bot.cache.set(key, true);
        }
    }

    @args(/(\d+)?/)
    async onMessage({ interaction }: ExecData) {
        const member = interaction.member;
        const key = this.key(interaction);
        if (member && key) {
            const vc = member.voice.channel;
            if (vc) {
                const plugin = interaction.bot.pluginMap.get('moan') as Moan;
                const amount = +interaction.args[0] || 1;
                for (let i = 0; i < amount; i++) {
                    await plugin.test(vc);                    
                    if (interaction.bot.cache.get(key)) {
                        break;
                    }
                }
                interaction.bot.cache.delete(key);
            } else {
                interaction.send('not in a vc uwu');
            }
        }
    }

    private key(interaction: MessageInteractionEvent | SlashInteractionEvent) {
        if (interaction.guild) {
            return interaction.guild.id + '_moan';
        }
    }
}

export default MoanCommand;