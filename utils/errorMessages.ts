// Error messages according to the spec: https://github.com/simpleledger/slp-specifications/blob/master/slp-postage-protocol.md#common-errors
const errorMessages = {
    UNSUPPORTED_CONTENT_TYPE: 'Unsupported Content-Type for payment',
    INVALID_PAYMENT: 'Invalid Payment',
    INVALID_SLP_OP_RETURN: 'Could not parse OP_RETURN output',
    UNSUPPORTED_SLP_TOKEN: 'Unsupported SLP token',
    INSUFFICIENT_POSTAGE: 'Insufficient postage paid',
    UNAVAILABLE_STAMPS: 'Stamps currently unavailable. In need of refill'
};

export default errorMessages;
