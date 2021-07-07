import fs from 'fs';
import path from 'path';
import parser from 'xml2js';

type XMLLocale = {
    resources: {
        string: {
            _: string;
            $: {
                name: string;
            };
        }[];
    };
};

type Locale = {
    [key: string]: string;
};

type LocaleMap = {
    [key: string]: Locale;
};

export default class Locales {
    private readonly dirname: string;
    private readonly files: string[];
    private readonly defaultLocale: string;
    private loaded: boolean = false;
    private locales: LocaleMap = {};

    constructor(localeDir: string, defaultLocale: string = 'english') {
        this.dirname = localeDir;
        this.files = fs.readdirSync(localeDir);
        this.defaultLocale = defaultLocale;
    }

    public async load() {
        for (const file of this.files) {
            const xmlIndex = file.lastIndexOf('.xml');
            if (xmlIndex !== -1) {
                const xml = fs.readFileSync(path.join(this.dirname, file));
                const data = (await parser.parseStringPromise(xml, { trim: true, normalizeTags: true })) as XMLLocale;
                const strings = data.resources.string.reduce(
                    (obj, { _: text, $: { name: key } }) => ((obj[key] = (text || '').replace(/ {7,8}/g, '')), obj),
                    {} as Locale
                );
                this.locales[file.slice(0, xmlIndex)] = strings;
            }
        }
        // this.missing();
        this.loaded = true;
    }

    private missing() {
        const locale = this.locales[this.defaultLocale];
        if (locale) {
            for (const localeName in this.locales) {
                if (localeName !== this.defaultLocale) {
                    const loc = this.locales[localeName];
                    for (const key in locale) {
                        if (!loc[key]) {
                            console.error(`key not found in ${localeName}: ${key}`);
                        }
                    }
                }
            }
        }
    }

    public string(language: string, key?: string) {
        if (!this.loaded) throw new Error('call load() first');

        if (!key) {
            key = language.slice();
            language = this.defaultLocale;
        }

        const locale = this.locales[language];
        if (locale) {
            const str = locale[key] || this.locales[this.defaultLocale][key];
            if (str) {
                return str;
            } else {
                return 'no stwing fwound oopsie woopsie';
            }
        } else {
            return 'language not fwound oopsie woopsie';
        }
    }
}
