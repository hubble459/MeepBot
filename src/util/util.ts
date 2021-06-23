import { Message } from 'discord.js';
import MeepBot from '..';
import MessageButton from '../model/button/message_button';
import { button } from '../model/docorators/command';
import SpecialInteractionEvent from '../model/interaction/special_interaction_event';

export function isTrue(text: string) {
    return /^y(es)?|true|on$/i.test(text);
}

export function editButtons(bot: MeepBot, message: Message, ...buttons: MessageButton[]) {
    const apiMessage = SpecialInteractionEvent.postData(false, message.content, false, buttons);

    if (!buttons.length) {
        apiMessage.data.data.components = null as any;
    }

    return (
        // @ts-ignore
        bot.api.channels[message.channel.id]
            .messages(message.id)
            .patch(apiMessage.data)
            // @ts-ignore
            .then((d) => bot.actions.MessageCreate.handle(d).message)
    );
}

export function stringToMilliseconds(time?: string) {
    if (!time) return 0;
    const split = time.split(':');
    let hours = 0;
    let minutes;
    let seconds;
    if (split.length === 3) {
        const [h, m, s] = split;
        hours = +h;
        minutes = +m;
        seconds = +s;
    } else {
        const [m, s] = split;
        minutes = +m;
        seconds = +s;
    }
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

export function millisecondsToTime(milliseconds: number) {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600).toString();
    const minutes = Math.floor((seconds / 60) % 60).toString();
    const seconds2 = Math.max(0, (seconds % 60) - 1).toString();
    return (
        (hours === '0' ? '' : hours.padStart(2, '0') + ':') + minutes.padStart(2, '0') + ':' + seconds2.padStart(2, '0')
    );
}
