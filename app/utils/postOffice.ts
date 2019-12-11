import Payment from '../types/payment';

/*
 * Receives a Payment object according to the Simple Ledger Postage Protocol Specification
 * See BEFORE POSTAGE example: https://github.com/simpleledger/slp-specifications/blob/master/slp-postage-protocol.md#example-transaction
 *
 * Returns a Payment object with postage according to the spec, "AFTER POSTAGE"
 */
export const addPostageToPayment = (payment: Payment): Payment => {
    return payment;
};

/*
 * Receives a Payment object with postage, and broadcasts the transaction
 *
 */
export const broadcastTransaction = () => {
    //TODO
};

/*
 * Receives a Payment object and a memo string, and returns a PaymentAck
 *
 */
export const buildPaymentAck = (payment: Payment) => {
    //TODO
};
