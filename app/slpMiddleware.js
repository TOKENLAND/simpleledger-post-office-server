const slpMiddleware = (req, res, next) => {
    if (!req.is('application/simpleledger-payment')) return next();
    let data = [];
    req.on('data', chunk => {
        data.push(chunk);
    });
    req.on('end', () => {
        if (data.length <= 0) return next();
        data = Buffer.concat(data);
        req.raw = data;
        next();
    });
};

module.exports = slpMiddleware;
