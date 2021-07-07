import Category from '../model/category';
import { args, bad, Command, ExecData } from '../model/docorators/command';

@Command(['echo', 'say'], Category.miscellaneous)
class Echo {
    @args(['**'], 'text', 'text to echo', true)
    async echo({ interaction }: ExecData) {
        await interaction.send(interaction.content);
    }

    @bad
    async error({ interaction }: ExecData) {
        await interaction.send(interaction.getString('echo_empty'));
    }
}

export default Echo;
