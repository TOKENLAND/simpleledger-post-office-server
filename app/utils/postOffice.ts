import Payment from '../types/payment';
import PaymentAck from '../types/paymentAck';
import { BITBOX } from 'bitbox-sdk';
import SLPSDK from 'slp-sdk';
import { mnemonic, postageRate } from '../config/postage';
import errorMessages from './errorMessages';
const BigNumber = require('bignumber.js');
const { Transaction, TransactionBuilder } = require('bitcoincashjs-lib');

const bitbox = new BITBOX();
const SLP = new SLPSDK();
const MIN_BYTES_INPUT = 181;

const validateSlpScript = (script: string[]): boolean => {
    const lokadIdHex = '534c5000';
    if (script[1] !== lokadIdHex) return false;
    return true;
};

const checkIfPostageIsPaid = (
    neededStamps: number,
    stampData: any,
    changeAddress0: any,
    script: any,
    tx: any,
): boolean => {
    if (stampData.rate > 0) {
        // Find vout with post office slp address
        let vout;
        for (let i = 1; i < tx.outs.length; i++) {
            const addressFromOut = SLP.Address.toSLPAddress(bitbox.Address.fromOutputScript(tx.outs[i].script));
            const postOfficeAddress = SLP.Address.toSLPAddress(changeAddress0);
            if (postOfficeAddress === addressFromOut) vout = 4 + i;
        }
        if (!vout) return false;

        // Check if token being spent is the same as described in the postage rate for the stamp
        // Check if postage is being paid accordingly
        if (stampData.tokenId === script[4]) {
            const amount = new BigNumber(script[vout], 16) / Math.pow(10, 8 + stampData.decimals);
            if (amount < stampData.rate * neededStamps) {
                return false;
            }
        } else {
            return false;
        }
    }
    return true;
};

/*
 * Receives a Payment object according to the Simple Ledger Postage Protocol Specification
 * See BEFORE POSTAGE example: https://github.com/simpleledger/slp-specifications/blob/master/slp-postage-protocol.md#example-transaction
 *
 * Returns a transaction hex with postage according to the spec, "AFTER POSTAGE"
 */
export const addPostageToPayment = async (payment: Payment): Promise<{ hex?: string; error?: string }> => {
    let error;
    let paymentHex;
    try {
        const rootSeed = bitbox.Mnemonic.toSeed(mnemonic);
        const masterHDNode = bitbox.HDNode.fromSeed(rootSeed, 'bitcoincash');
        const bip44BCHAccount = bitbox.HDNode.derivePath(masterHDNode, "m/44'/245'/0'");
        const changeAddressNode0 = bitbox.HDNode.derivePath(bip44BCHAccount, '0/0');

        // get the cash address
        const changeAddress0 = bitbox.HDNode.toCashAddress(changeAddressNode0);
        const utxoSet: any = await bitbox.Address.utxo(changeAddress0);
        const utxos = utxoSet.utxos;

        // Import existing tx into a new TransactionBuilder
        let tx = Transaction.fromHex(payment.transactions[0].toString('hex'));
        console.log(`Transaction: `, tx);

        // Validate SLP tokens and OP_RETURN
        const script = bitbox.Script.toASM(tx.outs[0].script).split(' ');
        if (!validateSlpScript(script)) return { error: errorMessages.INVALID_SLP_OP_RETURN };

        // Check if SLP token is supported and if need to pay postage
        const stampData = postageRate.stamps.filter(stamp => stamp.tokenId === script[4]).pop() || false;
        if (!stampData) return { error: errorMessages.UNSUPPORTED_SLP_TOKEN };

        // Check is postage is being paid, if necessary
        const neededStamps = tx.outs.length - tx.ins.length;
        if (!checkIfPostageIsPaid(neededStamps, stampData, changeAddress0, script, tx))
            return { error: errorMessages.INSUFFICIENT_POSTAGE };

        const builder = TransactionBuilder.fromTransaction(tx, 'mainnet');

        // Add stamps
        const stamps = utxos.filter(utxo => utxo.satoshis === postageRate.weight + MIN_BYTES_INPUT);
        if (neededStamps > stamps.length) return { error: errorMessages.UNAVAILABLE_STAMPS };
        stamps.map(stamp => builder.addInput(stamp.txid, stamp.vout));

        let redeemScript;
        // Don't sign the inputs from the original transaction, only sign the stamps
        for (let i = tx.ins.length; i < neededStamps + 1; i += 1) {
            builder.sign(
                i,
                // Sign with changeAddressNode0 (since the utxos belong to this address)
                bitbox.HDNode.toKeyPair(changeAddressNode0),
                redeemScript,
                0x01, // SIGHASH_ALL
                postageRate.weight + MIN_BYTES_INPUT,
            );
        }

        tx = builder.build();
        paymentHex = tx.toHex();
    } catch (error) {
        console.error(error);
        throw error;
    }
    return { hex: paymentHex, error };
};

/*
 * Receives a Payment object with postage, broadcasts the transaction,
 * add memo, return PaymentAck
 */
export const broadcastTransaction = async (payment, paymentWithPostage): Promise<PaymentAck> => {
    const transactionId = await bitbox.RawTransactions.sendRawTransaction(paymentWithPostage);
    console.log(`https://explorer.bitcoin.com/bch/tx/${transactionId}`);
    payment.transactions[0] = Buffer.from(paymentWithPostage, 'hex');
    return { payment, memo: '' };
};
