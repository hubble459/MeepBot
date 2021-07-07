import fs from 'fs';
import path from 'path';
import MeepBot from '..';
import MeepPlugin from '../model/plugin';

class PluginUtils {
    private readonly bot: MeepBot;
    private readonly pluginDir: string;

    constructor(bot: MeepBot, pluginDir: string) {
        this.bot = bot;
        this.pluginDir = pluginDir;
        if (fs.existsSync(pluginDir)) {
            this.loadPluginsRecursively(this.pluginDir);
        } else {
            console.error(`[${'PLUGIN'.color('fgMagenta')}]`, `'${pluginDir}' does not exist`);
        }
    }

    private loadPluginsRecursively(dirname: string) {
        const files = fs.readdirSync(dirname);
        for (const file of files) {
            const pathname = path.join(dirname as string, file);
            const stats = fs.lstatSync(pathname);
            if (stats.isDirectory()) {
                this.loadPluginsRecursively(pathname);
            } else if (path.extname(file).toLowerCase() === '.js') {
                try {
                    const plugin = new (require(pathname)).default(this.bot);
                    if (plugin instanceof MeepPlugin) {
                        this.bot.pluginMap.set(file.slice(0, file.lastIndexOf('.')), plugin);
                    } else {
                        console.error(`Plugin not instance of MeepPlugin ${pathname}`);
                    }
                } catch (e) {
                    console.error(`Bad file ${pathname}`, e);
                }
            }
        }
    }
}

export default PluginUtils;
