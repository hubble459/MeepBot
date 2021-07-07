import Category from '../model/category';
import { args, Command, ExecData } from '../model/docorators/command';
import SlashInteractionEvent from '../model/interaction/slash_interaction_event';

@Command(['regirock', 'regi'], Category.miscellaneous, 60000)
class Regirock {
    @args(true)
    async echo({ interaction }: ExecData) {
        if (interaction instanceof SlashInteractionEvent) {
            await interaction.send('GIGIGIGI', true);
        } else {
            await interaction.send('UNK UNK UNK');
        }
    }
}

export default Regirock;
