# Simple Ledger Post Office Server
_An implementation of the Simple Ledger Postage Protocol_

### What it does, exactly?
It is a server that accepts modified [Simple Ledger Payment Protocol](https://github.com/simpleledger/slp-specifications/blob/master/slp-payment-protocol.md) transactions, adds _stamps_ (inputs) to it to cover the
fee costs, broadcasts the transaction and optionally takes SLP payments for the _postage_.

It enables all sorts of applications where the user can have only SLP tokens in their wallet and send transactions without the need for BCH as "gas", with the Post Office covering the costs of the transaction.

### Demo
[https://www.youtube.com/watch?v=NGCzujDCgYs](https://www.youtube.com/watch?v=NGCzujDCgYs)

This demo uses a fork of Badger Wallet to send an SLP payment to someone else through a post office, without having any BCH.

### Is it ready yet?
Right now the master branch contains a rough prototype that was used in the demo. 
You can follow [this page](https://github.com/TOKENLAND/simpleledger-post-office-server/projects/1) to see the progress made towards a stable 0.0.1 version.

**Use it at your own risk, there are no guarantees**.

### Installation and usage

- Install the required packages and run the server

```
npm install -g yarn
yarn
yarn cli
yarn start
```

- Set up your postage rate and accepted SLP tokens with `yarn cli`.
- Fill up the server wallet with UTXOs comprising of 546 satoshis.
- Send a modified transaction from a client to the server, according to the protocol.

### More information about the protocol

- [Simple Ledger Postate Protocol Specification](https://github.com/simpleledger/slp-specifications/blob/master/slp-postage-protocol.md)
- [Medium article by the protocol creator, Vin Armani](https://medium.com/@vinarmani/simple-ledger-postage-protocol-enabling-a-true-slp-token-ecosystem-on-bitcoin-cash-f960a58c16c4)

### Maintainer

@alcipir

### License

MIT License

