const Enmap = require('enmap');

const database = new Enmap({
    name: 'database',
    autoFetch: true,
    fetchAll: false,
    dataDir: './src/assets/enmap' + (process.env.DEVELOPMENT ? '_dev' : '')
});

module.exports = database;