import express = require('express');
import slpMiddleware from './slpMiddleware';
import Payment from './types/payment';
import PaymentAck from './types/paymentAck';
import { postageRate } from './config/postage';
import { addPostageToPayment,
         broadcastTransaction,
         buildPaymentAck } from './utils/postOffice';

const app: express.Application = express();

app.use(slpMiddleware);

app.get('/postage', function(req: express.Request, res: express.Response): void {
    res.send(postageRate);
});

app.post('/postage', function(req: express.Request, res: express.Response): void {
    try { 
    const paymentWithPostage: Payment = addPostageToPayment(payment);
    broadcastTransaction(payment);
    const paymentAck: PaymentAck = buildPaymentAck(payment);
    res.send(paymentAck);
    } catch(e) {
    }
    
});

app.listen(3000, (): void => {
    console.log('Post Office listening on port 3000!');
});
