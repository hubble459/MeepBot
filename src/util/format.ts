interface String {
    format(...args: any[]): string;
}

String.prototype.format = function () {
    const args = arguments;
    return this.replace(/{(\d+)}/g, (match: string, index: number) => {
        const arg = args[index];
        return arg !== undefined ? arg : match;
    });
};
