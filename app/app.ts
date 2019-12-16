import express = require('express');
import bitboxSdk = require('bitbox-sdk');
import slpMiddleware from './slpMiddleware';
import Payment from './types/payment';
import PaymentAck from './types/paymentAck';
import PaymentProtocol from 'bitcore-payment-protocol';
import { postageRate, mnemonic } from './config/postage';
import { addPostageToPayment, broadcastTransaction } from './utils/postOffice';

const { BITBOX } = bitboxSdk;
const bitbox = new BITBOX();

const app: express.Application = express();

app.use(slpMiddleware);

app.get('/postage', function(req: express.Request, res: express.Response): void {
    res.send(postageRate);
});

app.post('/postage', async function(req: any, res: express.Response) {
    try {
        console.log('Decoding payment...');
        const payment: Payment = PaymentProtocol.Payment.decode(req.raw);
        console.log('Payment: ', payment);
        console.log('Adding stamps to the transcation...');
        const paymentHexWithPostage = await addPostageToPayment(payment);
        console.log('Transaction hex: ', paymentHexWithPostage);
        console.log('Sending transaction....');
        const paymentAckObj: PaymentAck = await broadcastTransaction(payment, paymentHexWithPostage);
        const paymentProtocol = new PaymentProtocol('BCH');
        res.send(paymentProtocol.makePaymentACK(paymentAckObj).serialize());
    } catch (e) {
        console.error(e);
    }
});

app.listen(3000, (): void => {
    const rootSeed = bitbox.Mnemonic.toSeed(mnemonic);
    const masterHDNode = bitbox.HDNode.fromSeed(rootSeed, 'bitcoincash');
    const bip44BCHAccount = bitbox.HDNode.derivePath(masterHDNode, "m/44'/245'/0'");
    const changeAddressNode0 = bitbox.HDNode.derivePath(bip44BCHAccount, '0/0');
    const changeAddress0 = bitbox.HDNode.toCashAddress(changeAddressNode0);
    console.log('Post Office listening on port 3000!');
    console.log('Send your UTXO stamps to:', changeAddress0);
});
