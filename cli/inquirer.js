const inquirer = require('inquirer');
const BCHJS = require("@chris.troutner/bch-js")
const BigNumber = require('bignumber.js')
let bchjs = new BCHJS()

module.exports = {
  askWalletAndPostageQuestions: () => {
    const questions = [
      { 
        name: 'network',
        type: 'list',
        choices: ['mainnet', 'testnet'],
        message: 'Choose a BCH network to connect: ',
      },
      {
        name: 'mnemonic',
        type: 'input',
        message: 'Enter your seed phrase for the Post Office wallet:',
        validate: function( value ) {
          if (value.length) {
            return true;
          } else {
            return 'Please enter your mnemonic.';
          }
        }
      },
      {
        name: 'slpAddress',
        type: 'input',
        message: 'Enter your SLP Address, which will receive all paid postage:',
        validate: async function(value) {
            try {
                const isValid = bchjs.SLP.Address.isSLPAddress(value);
                return isValid;
            } catch (e) {
                value = '';
                return 'Please enter a valid SLP Address.';
            }
        }
      },
      { 
        name: 'apiKey',
        type: 'input',
        default: '',
        message: 'Enter your API key for fullstack.cash (optional): ',
      },
      {
        name: 'weight',
        type: 'number',
        message: 'Enter the stamp weight (in satoshis):',
        default: 365,
        validate: function( value ) {
          if (!isNaN(value)) {
            return true;
          } else {
            return 'Please enter the desired stamp weight.';
          }
        }
      },
    
    ]
    return inquirer.prompt(questions);
  },
  askStampQuestions: () => {
    const questions = [
        {
          name: 'tokenDetails',
          type: 'input',
          message: 'Enter the token id for this stamp: ',
          filter: async function(value) {
                const tokenDetails = await bchjs.SLP.Utils.list(value);
                if (tokenDetails.id === 'not found')
                  return ''
                return tokenDetails;
          },
          validate: async function( value ) {
            if(!value) 
                return 'Token not found. Please enter a valid token Id. Check simpleledger.info for more information.';
            return true
          }
        },
        {
            name: 'rate',
            type: 'number',
            message: 'Enter how many tokens will be charged per stamp: ',
            validate: function( value ) {
            if (!isNaN(value)) {
                return true;
              } else {
                return 'Please enter a valid amount.';
              }
            }
         },
         {
            name: 'moreStamps',
            type: 'confirm',
            message: 'Add more stamps? ',
         }
        ]

    
      return inquirer.prompt(questions);
  }
};