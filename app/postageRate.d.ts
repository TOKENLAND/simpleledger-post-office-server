export type Stamp = {
    symbol: string;
    tokenId: string;
    decimals: number;
    rate: number;
};

export type PostageRate = {
    version: number;
    address: string;
    weight: number;
    stamps: [Stamp];
};
