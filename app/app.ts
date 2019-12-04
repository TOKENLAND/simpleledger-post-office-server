import express = require('express');
import { MerchantData, Stamp } from "./merchantData";

const app: express.Application = express();

app.get('/postage', function (req, res) {
  const stamp : Stamp = {
      symbol: "STP",
      tokenId: "",
      decimals: 0,
      rate: 0
  }

  const merchantData : MerchantData = {
      version: 1,
      address: "",
      weight: 0,
      stamps: [stamp]
  }
  res.send(merchantData);
});

app.listen(3000, function () {
  console.log('Post Office listening on port 3000!');
});
