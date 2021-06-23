import { DMChannel, Guild, GuildMember, Message, NewsChannel, Snowflake, TextChannel, User } from 'discord.js';
import MeepBot, { Settings } from '../..';

export enum InteractionCallbackType {
    Pong = 1, // ACK a Ping
    ChannelMessageWithSource = 4, // Respond to an interaction with a message
    DeferredChannelMessageWithSource = 5, // ACK an interaction and edit a response later, the user sees a loading state
    DeferredUpdateMessage = 6, // for components, ACK an interaction and edit the original message later; the user does not see a loading state
    UpdateMessage = 7 // for components, edit the message the component was attached to
}

export enum InteractionType {
    message = 1,
    slashCommand = 2,
    button = 3
}

abstract class InteractionEvent {
    readonly bot: MeepBot;
    readonly version: number;
    readonly applicationId?: string;
    readonly type: InteractionType;
    readonly id: Snowflake;
    readonly token: string;
    readonly channel: TextChannel | DMChannel | NewsChannel;
    readonly guild?: Guild;
    readonly user: User;
    readonly member?: GuildMember;
    readonly settings: Settings;
    readonly getString: (key: string, ...format: any[]) => string;
    readonly tag: (text: TemplateStringsArray, ...vars: any[]) => string;
    author: User;

    constructor(bot: MeepBot, data: any) {
        this.bot = bot;

        if (data instanceof Message) {
            this.version = 0;
            this.type = InteractionType.message;
            this.token = bot.token!;
            this.channel = data.channel;
            this.guild = data.guild || undefined;
            this.user = data.author;
            this.member = data.member || undefined;
        } else {
            this.version = data.version;
            this.token = data.token;
            this.type = data.type;
            this.applicationId = data.application_id;
            this.guild = data.guild_id ? bot.guilds.cache.get(data.guild_id) : undefined;
            this.channel = bot.channels.cache.get(data.channel_id)! as TextChannel | DMChannel | NewsChannel;
            this.member = this.guild ? this.guild.members.resolve(data.member.user.id) || data.member : undefined;
            this.user = this.member
                ? this.member.user
                : this.bot.users.resolve(data.user ? data.user.id : data.member.user.id) ||
                  (data.user ? data.user : data.member.user);
        }
        this.id = data.id;
        this.author = this.user;
        this.settings = bot.getSettings({ guild: this.guild, user: this.user });

        this.getString = (key: string, ...format: any[]) =>
            this.bot.locales.string(this.settings.language, key).format(...format);
        this.tag = (text: TemplateStringsArray, ...vars: any[]) => {
            // Clone text
            const t = text.slice();
            for (let i = 0; i < text.length; i++) {
                t.splice(t.indexOf(text[i], i) + 1, 0, vars.shift());
            }
            let id = this.user.id;
            if (this.guild) {
                id = this.guild.id;
            }
            return '[' + id.slice(0, 5).color('fgMagenta') + '] ' + t.join('');
        };
    }
}

export default InteractionEvent;
