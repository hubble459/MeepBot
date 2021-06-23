import Category from '../model/category';
import { args, Command, ExecData } from '../model/docorators/command';

@Command('regirock', Category.miscellaneous, 60000, 'regi')
class Regirock {
    @args(true)
    async echo({ interaction, slashInteraction }: ExecData) {
           await slashInteraction?.send('FUCO', true)
    }
}

export default Regirock;
