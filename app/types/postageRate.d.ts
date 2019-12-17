export type Stamp = {
    symbol: string;
    tokenId: string;
    decimals: number;
    rate: number;
};

export type PostageRate = {
    version: number;
    address: string;
    transactionttl: number;
    weight: number;
    stamps: [Stamp];
};
