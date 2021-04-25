const express = require('express');
const app = express();
const port = process.env.PORT || 80;

app.use(express.static('./src/server/static'));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

