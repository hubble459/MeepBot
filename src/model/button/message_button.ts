import { MessageButtonRow } from '../interaction/special_interaction_event';

export enum MessageButtonStyle {
    blurple = 1,
    grey = 2,
    green = 3,
    red = 4,
    url = 5
}

class MessageButton {
    readonly type: number = 2;
    style: number;
    label: string;
    disabled: boolean;
    url?: string;
    // tslint:disable-next-line
    custom_id?: string;

    constructor(button?: MessageButton) {
        const { style, label, disabled, url, custom_id } = button || {};
        this.style = style || MessageButtonStyle.blurple;
        this.label = label || 'Button';
        this.disabled = disabled || false;
        this.url = style === MessageButtonStyle.url ? url : undefined;
        this.custom_id = custom_id && style !== MessageButtonStyle.url ? custom_id : 'button';
    }

    public setStyle(style: (1 | 2 | 3 | 4 | 5) | MessageButtonStyle) {
        this.style = style;
        if (style !== MessageButtonStyle.url) {
            this.url = undefined;
        }
        return this;
    }

    public setLabel(label: string) {
        this.label = label;
        return this;
    }

    public setDisabled(disabled: boolean) {
        this.disabled = disabled;
        return this;
    }

    public setURL(url: string) {
        this.url = url;
        this.style = MessageButtonStyle.url;
        this.custom_id = undefined;
        return this;
    }

    public setCustomId(customId: string) {
        this.custom_id = this.style === MessageButtonStyle.url ? undefined : customId;
        return this;
    }

    public asRow(): MessageButtonRow {
        return {
            type: 1,
            components: [this]
        };
    }

    static next(customId: string, disabled: boolean = false) {
        return new MessageButton().setLabel('next').setDisabled(disabled).setCustomId(customId);
    }

    static previous(customId: string, disabled: boolean = false) {
        return new MessageButton().setLabel('previous').setDisabled(disabled).setCustomId(customId);
    }

    toJSON() {
        return {
            type: 2,
            style: this.style,
            label: this.label,
            disabled: this.disabled,
            url: this.url,
            custom_id: this.custom_id
        };
    }
}

export default MessageButton;
