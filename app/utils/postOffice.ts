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
        console.log(tx);

        // Validate SLP tokens and OP_RETURN
        const lokadIdHex = '534c5000';
        const script = bitbox.Script.toASM(tx.outs[0].script).split(' ');

        if (script[1] !== lokadIdHex) return { error: errorMessages.INVALID_SLP_OP_RETURN };

        // Check if SLP token is supported and if need to pay postage
        let isSupported = false;
        let isPostagePaid = false;
        let stampTokenId;
        let stampRate;
        let stampDecimals;
        postageRate.stamps.forEach(stamp => {
            if (stamp.tokenId === script[4]) {
                stampTokenId = script[4];
                // Check if client needs to pay postage
                if (stamp.rate === 0) {
                    isPostagePaid = true;
                }

                if (stamp.decimals === 0) {
                    stampRate = Number(stamp.rate);
                } else {
                    stampRate = Number(stamp.rate) / Math.pow(10, stamp.decimals);
                }
                stampDecimals = stamp.decimals;
                isSupported = true;
            }
        });

        if (!isSupported) return { error: errorMessages.UNSUPPORTED_SLP_TOKEN };

        // Check is postage is being paid, if necessary
        const neededStamps = tx.outs.length - tx.ins.length;
        if (!isPostagePaid) {
            // Find vout with post office slp address
            let vout;
            for (let i = 1; i < tx.outs.length; i++) {
                const addressFromOut = SLP.Address.toSLPAddress(bitbox.Address.fromOutputScript(tx.outs[i].script));
                const postOfficeAddress = SLP.Address.toSLPAddress(changeAddress0);
                if (postOfficeAddress === addressFromOut) vout = 4 + i;
            }
            if (!vout) return { error: errorMessages.INSUFFICIENT_POSTAGE };

            // Check if token being spent is the same as described in the postage rate for the stamp
            // Check if postage is being paid accordingly
            if (stampTokenId === script[4]) {
                const amount = new BigNumber(script[vout], 16) / Math.pow(10, 8 + stampDecimals);
                if (amount < stampRate * neededStamps) {
                    return { error: errorMessages.INSUFFICIENT_POSTAGE };
                }
            } else {
                return { error: errorMessages.INSUFFICIENT_POSTAGE };
            }
        }

        const builder = TransactionBuilder.fromTransaction(tx, 'mainnet');

        // Add stamps
        const stamps = utxos.filter(utxo => utxo.satoshis === postageRate.weight + MIN_BYTES_INPUT);
        if (neededStamps > stamps.length) return { error: errorMessages.UNAVAILABLE_STAMPS };

        for (let i = 0; i < neededStamps; i++) {
            const txid = stamps[i].txid;
            builder.addInput(txid, stamps[i].vout);
        }

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
