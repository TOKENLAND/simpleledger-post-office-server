export type UTXO = {
  _id: string;
  txid: string;
  confirmations: number;
  amount: number;
  height: number;
  vout: any;
  tx: {};
  satoshis: number;
  slp: { baton: any; token: string; quantity: number };
  validSlpTx: boolean;
  spendable: boolean;
  address: string;
};
