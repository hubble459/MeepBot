import { GuildMember, Message, MessageEmbed, User } from 'discord.js';
import MeepBot from '../..';
import MessageButton from '../button/message_button';
import InteractionEvent, { InteractionType } from './interaction_event';
import SpecialInteractionEvent, { MessageButtonRow } from './special_interaction_event';

class MessageInteractionEvent extends InteractionEvent {
    readonly message: Message;
    readonly args: string[];
    readonly content: string;
    reply?: Message;

    constructor(bot: MeepBot, data: any) {
        super(bot, data);
        if (this.type === InteractionType.message) {
            this.message = data;
            this.args = this.message.content.split(/ +/);
            this.args.shift();
            if (this.settings.space) {
                this.args.shift();
            }
            this.content = this.args.join(' ');
        } else {
            throw new Error('Interaction not of type message!');
        }
    }

    async send(content: string | MessageEmbed, ...embeds: (MessageEmbed | MessageButton | MessageButtonRow)[]) {
        if (this instanceof User || this instanceof GuildMember) {
            return this.createDM().then((dm) => dm.send(content, {}));
        }

        const apiMessage = SpecialInteractionEvent.postData(false, content, false, embeds);
        // @ts-ignore
        this.reply = this.bot.api.channels[this.channel.id].messages
            .post(apiMessage.data)
            // @ts-ignore
            .then((d) => this.bot.actions.MessageCreate.handle(d).message);
        return this.reply!;
    }
}

export default MessageInteractionEvent;
