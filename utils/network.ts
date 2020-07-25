const errorMessages = require('./errorMessages');
const BCHJS = require("@chris.troutner/bch-js")
const config = require('../config.json');

const bchjs = new BCHJS({
  restURL: config.network === 'mainnet' ? 'https://api.fullstack.cash/v3/' : 'https://tapi.fullstack.cash/v3/',
  apiToken: config.apiKey
})

const MIN_BYTES_INPUT = 181

export const fetchUTXOsForStamps = async (numberOfStamps: number, cashAddress: string) => {
    let stamps;
    const utxos = await bchjs.Blockbook.utxo(cashAddress)
    const coloredUTXOs = await bchjs.SLP.Utils.tokenUtxoDetails(utxos.filter(utxo => utxo.satoshis === config.postageRate.weight + MIN_BYTES_INPUT))
    stamps = coloredUTXOs.filter(tokenUtxo => tokenUtxo.isValid === false);
    if (stamps.length < numberOfStamps) {
        throw new Error(errorMessages.UNAVAILABLE_STAMPS)
    }
    return stamps.slice(0, numberOfStamps)
}

export const validateSLPTransaction = async () => {

}

export const broadcastTransaction = async (rawTransactionHex: any) => {
    console.log('broadcasting transaction', rawTransactionHex);
    const transactionId = await bchjs.RawTransactions.sendRawTransaction(rawTransactionHex)
    console.log(`https://explorer.bitcoin.com/bch/tx/${transactionId}`)
    return transactionId
}

