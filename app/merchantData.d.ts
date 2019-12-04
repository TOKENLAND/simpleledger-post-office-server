export type Stamp = {
    symbol: string,
    tokenId: string,
    decimals: number,
    rate: number,
}

export interface MerchantData {
    readonly version: number,
    address: string,
    weight: number,
    stamps: [Stamp]
}
