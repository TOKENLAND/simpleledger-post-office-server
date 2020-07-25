import express = require('express')
import cors = require('cors')
import slpMiddleware from './utils/slpMiddleware'
import Payment from './types/payment'
import PaymentAck from './types/paymentAck'
import PaymentProtocol from 'bitcore-payment-protocol'
import errorMessages from './utils/errorMessages'
const { Transaction, TransactionBuilder } = require('bitcoincashjs-lib')
const { getNeededStamps, buildTransaction } = require('./utils/transaction')
const { fetchUTXOsForStamps, validateSlpTransaction, broadcastTransaction } = require('./utils/network')
const BCHJS = require("@chris.troutner/bch-js")
const config = require('./config.json')

const bchjs = new BCHJS({
    restURL: config.network === 'mainnet' ? 'https://api.fullstack.cash/v3/' : 'https://tapi.fullstack.cash/v3/',
    apiToken: config.apiKey
})

const app: express.Application = express()
app.use(cors())
app.use(slpMiddleware)


app.get('/postage', function(req: express.Request, res: express.Response): void {
    res.send(config.postageRate)
})

app.post('/postage', async function(req: any, res: express.Response) {
    const paymentProtocol = new PaymentProtocol('BCH')
    try {
        if (!req.is('application/simpleledger-payment')) {
            res.status(400).send(errorMessages.UNSUPPORTED_CONTENT_TYPE)
            return
        }

        const rootSeed = await bchjs.Mnemonic.toSeed(config.mnemonic);
        const hdNode = bchjs.HDNode.fromSeed(rootSeed);
        const keyPair = bchjs.HDNode.toKeyPair(hdNode);
        const payment: Payment = PaymentProtocol.Payment.decode(req.raw)
        const incomingTransaction = Transaction.fromHex(payment.transactions[0].toString('hex'))
        const neededStampsForTransaction = getNeededStamps(incomingTransaction)
        const stamps = await fetchUTXOsForStamps(neededStampsForTransaction, bchjs.HDNode.toCashAddress(hdNode))
        const stampedTransaction = buildTransaction(incomingTransaction, stamps, keyPair)
        const resultPostage = await broadcastTransaction(stampedTransaction, payment)
        res.status(200).json(resultPostage)
    } catch (e) {
        console.error(e)
        res.status(500).send(e.message)
    }
})

app.listen(3000, (): void => {
    console.log('Post Office listening on port 3000!')
})
