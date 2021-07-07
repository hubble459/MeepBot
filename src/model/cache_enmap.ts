import Enmap from 'enmap';

type CachedItem = {
    used: number;
    val: any;
};

class CacheEnmap {
    private readonly enmap: Enmap<string | number, any>;

    constructor(databaseDir: string) {
        this.enmap = new Enmap({
            name: 'cache',
            dataDir: databaseDir,
            fetchAll: true
        });

        // Every hour, remove items that haven't been used for 2 hours  
        setInterval(
            () => {
                const removed = this.enmap.sweep(({ used }: CachedItem) => !used || Date.now() - used >= 7.2e6);
                console.log(`[${'SWEEP'.color('fgYellow')}] swept ${removed} items`);
            },
            3.6e6
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

    delete(key: string | number, path?: string) {
        this.enmap.delete(key, path);
    }

    remove(key: string | number, val: any, path?: string) {
        this.enmap.remove(key, val, path);
    }
}

export default CacheEnmap;
