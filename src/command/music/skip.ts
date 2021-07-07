import Category from '../../model/category';
import { args, bad, Command, ExecData } from '../../model/docorators/command';
import SlashInteractionEvent from '../../model/interaction/slash_interaction_event';

@Command(['skip', 's'], Category.music)
class Skip {
    @args(true)
    async skip({ interaction }: ExecData) {
        await interaction.bot.musicPlayer.skip(interaction);
        if (interaction instanceof SlashInteractionEvent && !interaction.deferred && !interaction.replied) {
            await interaction.defer();
        }
    }

    @bad
    async noArgs({ interaction }: ExecData) {
        interaction.send('incorrect argument passed');
    }
}

export default Skip;
