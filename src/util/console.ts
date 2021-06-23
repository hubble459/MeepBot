const log = console.log;

const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
};

export enum Color {
    reset = '\x1b[0m',
    bright = '\x1b[1m',
    dim = '\x1b[2m',
    underscore = '\x1b[4m',
    blink = '\x1b[5m',
    reverse = '\x1b[7m',
    hidden = '\x1b[8m',

    fgBlack = '\x1b[30m',
    fgRed = '\x1b[31m',
    fgGreen = '\x1b[32m',
    fgYellow = '\x1b[33m',
    fgBlue = '\x1b[34m',
    fgMagenta = '\x1b[35m',
    fgCyan = '\x1b[36m',
    fgWhite = '\x1b[37m',

    bgBlack = '\x1b[40m',
    bgRed = '\x1b[41m',
    bgGreen = '\x1b[42m',
    bgYellow = '\x1b[43m',
    bgBlue = '\x1b[44m',
    bgMagenta = '\x1b[45m',
    bgCyan = '\x1b[46m',
    bgWhite = '\x1b[47m'
}

type ColorString =
    | 'fgBlack'
    | 'fgRed'
    | 'fgGreen'
    | 'fgYellow'
    | 'fgBlue'
    | 'fgMagenta'
    | 'fgCyan'
    | 'fgWhite'
    | 'bgBlack'
    | 'bgRed'
    | 'bgGreen'
    | 'bgYellow'
    | 'bgBlue'
    | 'bgMagenta'
    | 'bgCyan'
    | 'bgWhite'
    | 'reset'
    | 'bright'
    | 'dim'
    | 'underscore'
    | 'blink'
    | 'reverse'
    | 'hidden';

declare global {
    interface String {
        color(color: Color | ColorString): string;
    }
}

String.prototype.color = function (color: Color | ColorString) {
    let c = color;
    if (!c.startsWith('\x1b')) {
        // @ts-ignore
        c = Color[color];
    }
    if (!c) {
        throw new Error('Bad color string');
    }

    return (c + this + Color.reset).trim();
};

console.log = (...data: any[]) => {
    log(`[${new Date().toLocaleDateString('en-US', options).color('fgCyan')}]`, ...data);
};

console.error = (...data: any[]) => {
    data.map((d) => {
        if (d instanceof Error && d.message) {
            d.message = d.message.color('fgRed');
        }
        return d;
    });
    log(`[${new Date().toLocaleDateString('en-US', options).color('fgRed')}]`, ...data);
};
