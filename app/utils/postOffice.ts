import Payment from '../types/payment';
import PaymentAck from '../types/paymentAck';
import { BITBOX } from 'bitbox-sdk';
import { mnemonic } from '../config/postage';
const { Transaction, TransactionBuilder } = require('bitcoincashjs-lib');

const bitbox = new BITBOX();

/*
 * Receives a Payment object according to the Simple Ledger Postage Protocol Specification
 * See BEFORE POSTAGE example: https://github.com/simpleledger/slp-specifications/blob/master/slp-postage-protocol.md#example-transaction
 *
 * Returns a transaction hex with postage according to the spec, "AFTER POSTAGE"
 */
export const addPostageToPayment = async (payment: Payment): Promise<string> => {
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
        const builder = TransactionBuilder.fromTransaction(tx, 'mainnet');

        // Add stamps
        let count = 3;
        utxos.forEach((utxo, index) => {
            if (utxo.satoshis == 546 && count > 0) {
                const txid = utxo.txid;
                builder.addInput(txid, 0);
                count--;
            }
        });
        let redeemScript;
        // Don't sign the inputs from the original transaction, only sign the stamps
        for (let i = 1; i < 4; i += 1) {
            builder.sign(
                i,
                // Sign with changeAddressNode0 (since the utxos belong to this address)
                bitbox.HDNode.toKeyPair(changeAddressNode0),
                redeemScript,
                0x01, // SIGHASH_ALL
                546,
            );
        }

        tx = builder.build();
        paymentHex = tx.toHex();
    } catch (error) {
        console.error(error);
    }
    return paymentHex;
};

/*
 * Receives a Payment object with postage, broadcasts the transaction,
 * add memo, return PaymentAck
 */
export const broadcastTransaction = async (payment, paymentWithPostage: string): Promise<PaymentAck> => {
    const transactionId = await bitbox.RawTransactions.sendRawTransaction(paymentWithPostage);
    console.log(`https://explorer.bitcoin.com/bch/tx/${transactionId}`);
    return { payment: { transactions: [Buffer.from(paymentWithPostage, 'hex')], ...payment }, memo: '' };
};
