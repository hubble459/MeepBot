import { Message } from 'discord.js';
import MeepBot from '../..';
import { InteractionType } from './interaction_event';
import SpecialInteractionEvent from './special_interaction_event';

export type ButtonData = {
    custom_id: string;
    component_type: number;
};

class ButtonInteractionEvent extends SpecialInteractionEvent {
    readonly message: Message;
    readonly data: ButtonData;

    constructor(bot: MeepBot, data: any) {
        super(bot, data);
        if (this.type === InteractionType.button) {
            this.message = new Message(bot, data.message, this.channel);
            this.author = this.message.author;
            this.data = data.data;
        } else {
            throw new Error('Interaction not of type button!');
        }
    }
}

export default ButtonInteractionEvent;
