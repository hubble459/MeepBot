import Category from '../../model/category';
import { args, bad, Command, ExecData } from '../../model/docorators/command';

@Command('skip', Category.music)
class Skip {
    @args(true)
    async skip({ interaction }: ExecData) {
        await interaction.bot.musicPlayer.skip(interaction);
    }

    @bad
    async noArgs({ interaction }: ExecData) {
        interaction.send('incorrect argument passed');
    }
}

export default Skip;
