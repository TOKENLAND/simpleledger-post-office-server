import errorMessages from './errorMessages'
import BCHJS from '@chris.troutner/bch-js'
import config from '../config.json'

const bchjs = new BCHJS({
    restURL: config.network === 'mainnet' ? 'https://api.fullstack.cash/v3/' : 'https://tapi.fullstack.cash/v3/',
    apiToken: config.apiKey,
})

const MIN_BYTES_INPUT = 181

export const fetchUTXOsForStampGeneration = async (cashAddress: string) => {
    const utxoResponse = await bchjs.Electrumx.utxo(cashAddress)
    const utxos = utxoResponse.utxos.filter(utxo => utxo.value > config.postageRate.weight * 2)
    if (utxos.length <= 0) {
        throw new Error('Insufficient Balance for Stamp Generation')
    }
    return utxos
}

export const fetchUTXOsForNumberOfStampsNeeded = async (numberOfStamps: number, cashAddress: string) => {
    const utxoResponse = await bchjs.Electrumx.utxo(cashAddress)
    const txIds = utxoResponse.utxos.map(utxo => utxo.tx_hash).splice(0, numberOfStamps)
    const areSlpUtxos = await bchjs.SLP.Utils.validateTxid(txIds)
    const filteredTxIds = areSlpUtxos.filter(tokenUtxo => tokenUtxo.valid === false).map(tokenUtxo => tokenUtxo.txid)
    const stamps = utxoResponse.utxos.filter(utxo => filteredTxIds.includes(utxo.tx_hash))
    if (stamps.length < numberOfStamps) {
        throw new Error(errorMessages.UNAVAILABLE_STAMPS)
    }
    return stamps.slice(0, numberOfStamps)
}

export const validateSLPInputs = async inputs => {
    const txIds = inputs.map(input => {
        const hash = Buffer.from(input.hash)
        return hash.reverse().toString('hex')
    })
    const validateResponse = await bchjs.SLP.Utils.validateTxid(txIds)
    validateResponse.forEach(response => {
        if (!response.valid) throw new Error(errorMessages.INVALID_PAYMENT)
    })
}

export const broadcastTransaction = async (rawTransactionHex: any) => {
    console.log('Broadcasting transaction...')
    const transactionId = await bchjs.RawTransactions.sendRawTransaction(rawTransactionHex)
    console.log(`https://explorer.bitcoin.com/bch/tx/${transactionId}`)
    return transactionId
}
