import { PostageRate, Stamp } from '../postageRate';

// Add your stamps according to the Stamp type
const sampleStamp: Stamp = {
    symbol: 'STP', // Token Ticker, e.g:
    tokenId: '', // Token Id, e.g: 4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf
    rate: 0, // Rate in base units
    decimals: 0, // Decimals for the rate
};

// Add the postage rate for the post office information provided in the /postage
// endpoint
export const postageRate: PostageRate = {
    version: 1,
    address: '', // SLP address for the merchant
    weight: 0,
    stamps: [sampleStamp],
};
