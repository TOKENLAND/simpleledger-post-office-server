import express = require('express');
import slpMiddleware from './slpMiddleware';
import { postageRate } from './config/postage';

const app: express.Application = express();

app.use(slpMiddleware);

app.get('/postage', function(req, res) {
    res.send(postageRate);
});

app.post('/postage', function(req, res) {
    res.send(postageRate);
});

app.listen(3000, function() {
    console.log('Post Office listening on port 3000!');
});
