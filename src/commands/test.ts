import Category from '../model/category';
import { args, bad, Command, ExecData } from '../model/docorators/command';

@Command('test', Category.miscellaneous)
class Test {
    @args()
    async test({ interaction }: ExecData) {
        const conn = await interaction.bot.musicPlayer.getConnection(interaction);
        if (conn) {
            conn.dispatcher.end();
        }

        await interaction.send('uwu');
    }

    @bad
    async error({ interaction }: ExecData) {
        await interaction.send(interaction.getString('echo_empty'));
    }
}

export default Test;
