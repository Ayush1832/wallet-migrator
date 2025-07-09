const chain = require("./Chain.json");
const token = require("./tokenList.json");
const chainLists = chain.Chains;
const tokenLists = token.Tokens;
const Web3 = require("web3");
const { ethers } = require('ethers');
const ERC20abi = require("../helpers/abi.json");
const adminWalletEVM = ""; // admin wallet address 
const PRIVATEKEY = ""; // admin wallet private key
const rpcUrl = "";  // rpc of the chain
const tokenAddress = ""; // token address
 
const ERC20Transfer = async (data) => {

    try {
        const web3connect = new Web3(
            new Web3.providers.HttpProvider(
                rpcUrl 
            )
        );

        const token_address = web3connect.utils.toChecksumAddress(tokenAddress);

        let tokenContract = new web3connect.eth.Contract(
            ERC20abi,
            token_address
        )

        let decimals = await tokenContract.methods.decimals().call();

        let amount = "0x" + (parseFloat((data.amount * (10 ** decimals)).toFixed(0))).toString(16);

        let Data = tokenContract.methods.transfer(data.reciepienAddress, amount).encodeABI();

        const from_account = web3connect.utils.toChecksumAddress(adminWalletEVM);
        const to_account = web3connect.utils.toChecksumAddress(token_address);

        let estimates_gas = await web3connect.eth.estimateGas({
            from: from_account,
            to: to_account,
            data: Data
        });

        const nonce = await web3connect.eth.getTransactionCount(
            from_account,
            "latest"
        ); //get latest nonce  

        let gasLimit = web3connect.utils.toHex(estimates_gas * 1.5);
        let gasPrice_bal = await web3connect.eth.getGasPrice();
        let gasPrice = web3connect.utils.toHex(gasPrice_bal);
        
        let tx = {
            from: from_account,
            to: to_account,
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            data: Data
        };

        let tx1 = await web3connect.eth.accounts.signTransaction(tx, PRIVATEKEY);
        let txrec = await web3connect.eth.sendSignedTransaction(tx1.rawTransaction);
       
        const expectedBlockTime = 3000; // 10sec

        const sleep = (milliseconds) => {
            return new Promise((resolve) => setTimeout(resolve, milliseconds));
        };

        let transreciept = null;
        while (transreciept == null) {
            transreciept = await web3connect.eth.getTransactionReceipt(txrec.transactionHash);
            await sleep(expectedBlockTime);
        }

        if (transreciept.status) {
            return transreciept
        } else {
            return false
        }
    } catch (error) {
        console.log(error);
        throw error
    }
}

module.exports = {
    ERC20Transfer
};