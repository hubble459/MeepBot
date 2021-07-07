import MeepBot from "..";

abstract class MeepPlugin {
    protected readonly bot: MeepBot;

    constructor(bot: MeepBot) {
        this.bot = bot;
    }
}

export default MeepPlugin;