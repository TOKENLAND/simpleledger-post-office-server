const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const fs = require('fs')
const inquirer = require('./inquirer')
const { error } = require('console')
const BigNumber = require('bignumber.js')

clear()

const run = async () => {
    console.log(chalk.green(figlet.textSync('SLP Post Office', { horizontalLayout: 'fitted' })))

    const walletAndPostageDetails = await inquirer.askWalletAndPostageQuestions()
    const stamps = []
    let moreStamps = true
    console.log('Configuring stamps...')
    while (moreStamps) {
        const addedStamp = await inquirer.askStampQuestions()
        const rate = new BigNumber(addedStamp.rate).times(10 ** addedStamp.tokenDetails.decimals)
        stamps.push({
            name: addedStamp.tokenDetails.name,
            symbol: addedStamp.tokenDetails.symbol,
            tokenId: addedStamp.tokenDetails.id,
            rate: rate,
            decimals: addedStamp.tokenDetails.decimals,
        })
        moreStamps = addedStamp.moreStamps
    }

    const configObj = {
        mnemonic: walletAndPostageDetails.mnemonic,
        apiKey: walletAndPostageDetails.apiKey,
        network: walletAndPostageDetails.network,
        postageRate: {
            version: 1,
            address: walletAndPostageDetails.slpAddress,
            weight: walletAndPostageDetails.weight,
            transactionttl: 30,
            stamps: stamps,
        },
    }

    fs.writeFile('config.json', JSON.stringify(configObj), err =>
        err ? console.error(err) : console.log('Post Office fully configured'),
    )
}

run()
