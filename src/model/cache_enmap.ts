import Enmap from 'enmap';

type CachedItem = {
    used: number;
    val: any;
};

class CacheEnmap {
    private readonly enmap: Enmap;

    constructor(databaseDir: string) {
        this.enmap = new Enmap({
            name: 'cache',
            dataDir: databaseDir,
            autoFetch: true,
            fetchAll: false
        });

        // Every 12 hours, remove items that haven't been used in 24 hours
        setTimeout(
            () => this.enmap.sweep((val: CachedItem) => !val.used || Date.now() - val.used > 86400000),
            43200000
        );
    }

    set(key: string | number, val: any, path?: string) {
        const item: CachedItem = {
            used: Date.now(),
            val
        };

        if (path) {
            return this.enmap.set(key, item, path);
        } else {
            return this.enmap.set(key, item);
        }
    }

    get(key: string | number) {
        let item = this.enmap.get(key) as CachedItem;
        if (item) {
            item = item.val;
            this.enmap.set(key, Date.now(), 'used');
        }
        return item as any;
    }
}

export default CacheEnmap;
