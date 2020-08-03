const slpMiddleware = (req, res, next) => {
    if (!req.is('application/simpleledger-payment')) return next()
    const data: any[] = []
    req.on('data', chunk => {
        data.push(chunk)
    })
    req.on('end', () => {
        if (data.length <= 0) return next()
        const endData = Buffer.concat(data)
        req.raw = endData
        next()
    })
}

export default slpMiddleware
