import { PostageRate, Stamp } from '../types/postageRate';
import { BITBOX } from 'bitbox-sdk';
import SLPSDK from 'slp-sdk';

const SLP = new SLPSDK();
const bitbox = new BITBOX();
const MIN_WEIGHT = 365;

// Mnemonic for the post office wallet
export const mnemonic = '';

// Get information from the wallet
const rootSeed = bitbox.Mnemonic.toSeed(mnemonic);
const masterHDNode = bitbox.HDNode.fromSeed(rootSeed, 'bitcoincash');
const bip44BCHAccount = bitbox.HDNode.derivePath(masterHDNode, "m/44'/245'/0'");
const changeAddressNode0 = bitbox.HDNode.derivePath(bip44BCHAccount, '0/0');
export const changeAddress = bitbox.HDNode.toCashAddress(changeAddressNode0);

// Add your stamps according to the Stamp type
const sampleStamp: Stamp = {
    symbol: 'SPICE',
    tokenId: '4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf',
    rate: 1, // Rate in base units
    decimals: 4, // Decimals for the rate
};

// Add the postage rate for the post office information provided in the /postage
// endpoint
export const postageRate: PostageRate = {
    version: 1,
    address: SLP.Address.toSLPAddress(changeAddress), // SLP address for the merchant
    weight: MIN_WEIGHT,
    transactionttl: 30,
    stamps: [sampleStamp],
};
