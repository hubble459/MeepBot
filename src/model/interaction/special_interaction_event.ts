import { Message, MessageEmbed } from 'discord.js';
import fetch, { RequestInit } from 'node-fetch';
import MeepBot from '../..';
import MessageButton from '../button/message_button';
import InteractionEvent, { InteractionCallbackType } from './interaction_event';
import MessageInteractionEvent from './message_interaction_event';
import SlashInteractionEvent from './slash_interaction_event';

export type MessageButtonRow = {
    type: 1;
    components: MessageButton[];
};

export type InteractionApplicationCommandCallbackData = {
    tts?: boolean; // is the response TTS
    content?: string; // message content
    embeds?: MessageEmbed[]; // supports up to 10 embeds
    allowed_mentions?: boolean; // allowed mentions allowed mentions object
    flags?: number; // set to 64 to make your response ephemeral
    components?: MessageButtonRow[] | MessageButton[]; // list of components
};

export type PostInteraction = {
    data: {
        type: InteractionCallbackType;
        data: InteractionApplicationCommandCallbackData;
    };
};

abstract class SpecialInteractionEvent extends InteractionEvent {
    private readonly endpoint: string;
    message?: Message;
    replied: boolean;
    deferred: boolean;

    constructor(bot: MeepBot, data: any) {
        super(bot, data);
        this.replied = (!!data.message);
        this.deferred = false;
        this.endpoint = `https://discord.com/api/webhooks/${this.applicationId}/${this.token}/messages/@original`;
    }

    public async defer(ephemeral: boolean = false) {
        if (this.deferred || this.replied) {
            throw new Error('BUTTON_ALREADY_REPLIED: This interaction already has a reply');
        }
        // @ts-ignore
        await this.bot.api.interactions(this.id, this.token).callback.post({
            data: {
                type: InteractionCallbackType.DeferredUpdateMessage,
                data: {
                    flags: ephemeral ? 64 : null
                }
            } as InteractionApplicationCommandCallbackData
        });
        this.deferred = true;
    }

    public async think(ephemeral: boolean = false): Promise<Message> {
        if (this.deferred || this.replied) {
            throw new Error('BUTTON_ALREADY_REPLIED: This interaction already has a reply');
        }
        // @ts-ignore
        await this.bot.api.interactions(this.id, this.token).callback.post({
            data: {
                type: InteractionCallbackType.DeferredChannelMessageWithSource,
                data: {
                    flags: ephemeral ? 64 : null,
                    content: 'owo'
                }
            }
        });
        this.deferred = true;
        return (this.message = await this.fetch());
    }

    public async send(
        data: string | MessageEmbed,
        ephemeral: boolean = false,
        ...embeds: (MessageEmbed | MessageButton | MessageButtonRow)[]
    ): Promise<Message> {
        if (this.deferred || this.replied) {
            throw new Error('BUTTON_ALREADY_REPLIED: This button already has a reply');
        }

        const postData = SpecialInteractionEvent.postData(this.deferred, data, ephemeral, embeds);

        // @ts-ignore
        await this.bot.api.interactions(this.id, this.token).callback.post(postData);
        this.replied = true;
        return this.fetch();
    }

    public async fetch(): Promise<Message> {
        const raw = await this.api('GET');

        return raw; // : this.channel ? this.channel.messages.add(raw) :
    }

    public async edit(
        data: string | MessageEmbed,
        ephemeral: boolean = false,
        ...embeds: (MessageEmbed | MessageButton)[]
    ) {

        if (this.deferred || this.replied) {
            const postData = SpecialInteractionEvent.postData(this.deferred, data, ephemeral, embeds);

            let msg: Message;
            if (this.message && this.message.edit) {
                // @ts-ignore
                msg = await this.bot.api.channels[this.channel.id]
                    .messages(this.message.id)
                    .patch(postData.data)

            } else {
                msg = await this.api('PATCH', postData.data.data);
            }

            if (!this.deferred) {
                let replied = this.replied;
                this.replied = false;
                await this.defer();
                this.replied = replied;
            }
            return msg;
        } else {
            throw new Error('BUTTON_ALREADY_REPLIED: This button has no reply');
        }
    }

    public async delete() {
        if (this.deferred === false && this.replied === false) {
            throw new Error('BUTTON_ALREADY_REPLIED: This button has no reply');
        }
        return await this.api('DELETE');
    }

    private async api(method: 'PATCH' | 'DELETE' | 'GET', data?: any) {
        const options: RequestInit = {
            method
        };
        if (method === 'PATCH') {
            if (!data) {
                throw new Error('Data can not be undefined if method is PATCH');
            } else {
                options.headers = {
                    'Content-Type': 'application/json'
                };
                options.body = JSON.stringify(data);
            }
        }
        return (await fetch(this.endpoint, options)).json();
    }

    public static postData(
        deferred: boolean,
        data: string | MessageEmbed,
        ephemeral: boolean,
        embeds: (MessageEmbed | MessageButton | MessageButtonRow)[]
    ) {
        const buttonRowList = embeds.filter((e) => e.type === 1) as MessageButtonRow[];
        const buttonList = embeds.filter((e) => e instanceof MessageButton) as MessageButton[];
        const embedList = embeds.filter((e) => e instanceof MessageEmbed) as MessageEmbed[];
        const postData: PostInteraction = {
            data: {
                type: deferred
                    ? InteractionCallbackType.DeferredChannelMessageWithSource
                    : InteractionCallbackType.ChannelMessageWithSource,
                data: {
                    flags: ephemeral ? 64 : 0
                }
            }
        };

        if (typeof data === 'string') {
            postData.data.data.content = data;
        } else if (typeof data === 'object') {
            embedList.unshift(data);
        }
        if (embedList.length) {
            postData.data.data.embeds = embedList;
        }
        if (buttonRowList.length) {
            postData.data.data.components = buttonRowList;
        }
        if (buttonList.length) {
            buttonList.forEach((btn: any) => (!btn.style ? (btn.style = 1) : undefined));
            if (!postData.data.data.components) {
                postData.data.data.components = [];
            }
            postData.data.data.components.push({
                type: 1,
                components: buttonList
            } as any);
        }

        return postData;
    }
}

export default SpecialInteractionEvent;
