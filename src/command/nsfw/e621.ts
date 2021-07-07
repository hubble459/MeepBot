import { MessageEmbed } from 'discord.js';
import E621API from 'e621';
import Category from '../../model/category';
import { args, Command, ExecData } from '../../model/docorators/command';

@Command('e621', Category.nsfw)
class E621 {
    private readonly e621: E621API;

    constructor() {
        this.e621 = new E621API();
    }

    @args(['**'], 'tags', 'Search on e621 with tags')
    async search(data: ExecData) {
        const tags = data.interaction.args as string[];
        const posts = await this.e621.getPosts(tags, 50);
        const random = posts[Math.floor(Math.random() * posts.length)];
        if (random) {
            const embed = new MessageEmbed()
                .setTitle(`Rating: ${random.rating}`)
                .setColor('#012e56')
                .setDescription(random.description);
            const source = random.sources[0];
            if (source) {
                if (source.startsWith('http')) {
                    embed.addField('source', `<${source}>`);
                } else {
                    embed.addField('source', source);
                }
            }

            embed
                .addField('general', random.tags.general.map((tag) => '`' + tag + '`').join(' '), true)
                .addField('general', random.tags.species.map((tag) => '`' + tag + '`').join(' '), true)
                .addField('general', random.tags.artist.map((tag) => '`' + tag + '`').join(' '), true)
                .setImage(random.file.url)
            data.interaction.send(embed);
        } else {
            data.interaction.send('not found, prolly bad tag bro');
        }
    }

    @args()
    async random(data: ExecData) {
        const posts = await this.e621.getPosts(undefined, 50);
        const random = posts[Math.floor(Math.random() * posts.length)];
        if (random) {
            const embed = new MessageEmbed()
                .setTitle(`Rating: ${random.rating}`)
                .setColor('#012e56')
                .setDescription(random.description);
            const source = random.sources[0];
            if (source) {
                if (source.startsWith('http')) {
                    embed.addField('source', `<${source}>`);
                } else {
                    embed.addField('source', source);
                }
            }

            embed
                .addField('general', random.tags.general.map((tag) => '`' + tag + '`').join(' '), true)
                .addField('general', random.tags.species.map((tag) => '`' + tag + '`').join(' '), true)
                .addField('general', random.tags.artist.map((tag) => '`' + tag + '`').join(' '), true)
                .setImage(random.file.url)
            data.interaction.send(embed);
        } else {
            data.interaction.send('not found, prolly bad tag bro');
        }
    }
}

export default E621;