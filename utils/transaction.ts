const errorMessages = require('./errorMessages');
const config = require('../config.json');
const { TransactionBuilder } = require('bitcoincashjs-lib')
const BCHJS = require("@chris.troutner/bch-js")
const BigNumber = require('bignumber.js')

const bchjs = new BCHJS({
    restURL: config.network === 'mainnet' ? 'https://api.fullstack.cash/v3/' : 'https://tapi.fullstack.cash/v3/',
    apiToken: config.apiKey
  })

  
enum SLP_SEND_OP_RETURN {
    LOKAD_ID_INDEX = 1,
    TOKEN_ID_INDEX = 4
}

const SLP_OP_RETURN_VOUT = 0;
const MIN_BYTES_INPUT = 181
const { TOKEN_ID_INDEX } = SLP_SEND_OP_RETURN;


const addStampsForTransactionAndSignInputs = (transaction: any, keyPairFromPostOffice: any, stamps: any): any => {
    const lastSlpInputVin = transaction.inputs.length - 1
    console.log('stamps length', stamps.length)
    for (let i = 0; i < stamps.length; i++) {
        transaction.addInput(stamps[i].txid, stamps[i].vout)
    }

    for (let i = lastSlpInputVin + 1; i <= stamps.length; i++) {
        let redeemScript
        console.log(`Signing...`, i)
        transaction.sign(
            i,
            keyPairFromPostOffice,
            redeemScript,
            0x01, // SIGHASH_ALL
            config.postageRate.weight + MIN_BYTES_INPUT,
        )
    }
    return transaction
}

export const getNeededStamps = (transaction: any): typeof BigNumber =>  {
    const transactionScript = bchjs.Script.toASM(transaction.outs[SLP_OP_RETURN_VOUT].script).split(' ')
    let neededStamps = 0
    let tokenOutputPostage = 0
    for (let i = 1; i < transaction.outs.length; i++) {
        const addressFromOut = bchjs.SLP.Address.toSLPAddress(bchjs.Address.fromOutputScript(transaction.outs[i].script))
        const postOfficeAddress = config.postageRate.address
        if (postOfficeAddress === addressFromOut) tokenOutputPostage = TOKEN_ID_INDEX + i
    }
    if (tokenOutputPostage === 0) throw new Error(errorMessages.INSUFFICIENT_POSTAGE)

    // Check if token being spent is the same as described in the postage rate for the stamp
    // Check if postage is being paid accordingly
    const postagePaymentTokenId = transactionScript[TOKEN_ID_INDEX]
    const stampDetails = config.postageRate.stamps.filter(stamp => stamp.tokenId === postagePaymentTokenId).pop() || false;
    const minimumStampsNeeded = (transaction.outs.length - transaction.ins.length) + 1
    if (stampDetails) {
        const stampRate = new BigNumber(stampDetails.rate).times(10 ** stampDetails.decimals);
        const amountPostagePaid = new BigNumber(transactionScript[tokenOutputPostage], 16).times(10 ** stampDetails.decimals)
        if (amountPostagePaid.isLessThan(stampRate.times(minimumStampsNeeded))) {
            throw new Error(errorMessages.INSUFFICIENT_POSTAGE)
        }
        neededStamps = amountPostagePaid.dividedBy(stampRate)
    } else {
        throw new Error(errorMessages.UNSUPPORTED_SLP_TOKEN)
    }
    
    return neededStamps
}

export const buildTransaction = (incomingTransaction: any, stamps: any, keyPairFromPostOffice: any): Buffer => {
    console.log('building transaction')
    const newTransaction = TransactionBuilder.fromTransaction(incomingTransaction, config.network)
    const newTransactionHex = addStampsForTransactionAndSignInputs(newTransaction, keyPairFromPostOffice, stamps).build().toHex()
    return newTransactionHex 
}