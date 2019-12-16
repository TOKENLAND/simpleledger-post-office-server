import express = require('express');
import bitboxSdk = require('bitbox-sdk');
import slpMiddleware from './slpMiddleware';
import Payment from './types/payment';
import PaymentAck from './types/paymentAck';
import PaymentProtocol from 'bitcore-payment-protocol';
import errorMessages from './utils/errorMessages';
import { postageRate, mnemonic } from './config/postage';
import { addPostageToPayment, broadcastTransaction } from './utils/postOffice';

const { BITBOX } = bitboxSdk;
const bitbox = new BITBOX();

const app: express.Application = express();
const paymentProtocol = new PaymentProtocol('BCH');

app.use(slpMiddleware);

app.get('/postage', function(req: express.Request, res: express.Response): void {
    res.send(postageRate);
});

app.post('/postage', async function(req: any, res: express.Response) {
    try {
	if (!req.is('application/simpleledger-payment')) {
	    res.status(400).send(errorMessages.UNSUPPORTED_CONTENT_TYPE);
	    return;
	}

        console.log('Decoding payment...');
        const payment: Payment = PaymentProtocol.Payment.decode(req.raw);
        console.log('Payment: ', payment);
        console.log('Adding stamps to the transcation...');
	const resultPostage = await addPostageToPayment(payment);
	if (resultPostage.error) {
	    res.status(400).send(resultPostage.error);
	    return;
	}
        console.log('Transaction hex: ', resultPostage.hex);
        console.log('Sending transaction....');
        const paymentAckObj: PaymentAck = await broadcastTransaction(payment, resultPostage.hex);
        res.send(paymentProtocol.makePaymentACK(paymentAckObj).serialize());
    } catch (e) {
        console.error(e);
	res.status(500).send({ error: 'An error has occurred on the post office server' });
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
