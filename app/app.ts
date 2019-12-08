import express = require('express');
import { postageRate } from './config/postage';

const app: express.Application = express();

app.get('/postage', function(req, res) {
    res.send(postageRate);
});

app.listen(3000, function() {
    console.log('Post Office listening on port 3000!');
});
