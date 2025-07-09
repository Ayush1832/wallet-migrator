const Web3 = require("web3");
const ERC20abi = require("./abi.json");
const adminWalletEVM = "";
const PRIVATEKEY = "";
const rpcUrl = "";
const tokenAddress = "";

const ERC20Transfer = async (data) => {
  try {
    const web3connect = new Web3(new Web3.providers.HttpProvider(rpcUrl));

    const token_address = web3connect.utils.toChecksumAddress(tokenAddress);

    let tokenContract = new web3connect.eth.Contract(ERC20abi, token_address);

    let decimals = await tokenContract.methods.decimals().call();

    let amount = web3connect.utils
      .toBN(data.amount)
      .mul(web3connect.utils.toBN(10).pow(web3connect.utils.toBN(decimals)));
    let Data = tokenContract.methods
      .transfer(data.recipientAddress, amount)
      .encodeABI();

    const from_account = web3connect.utils.toChecksumAddress(adminWalletEVM);
    const to_account = web3connect.utils.toChecksumAddress(token_address);

    let estimates_gas = await web3connect.eth.estimateGas({
      from: from_account,
      to: to_account,
      data: Data,
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
      data: Data,
    };

    let tx1 = await web3connect.eth.accounts.signTransaction(tx, PRIVATEKEY);
    let txrec = await web3connect.eth.sendSignedTransaction(tx1.rawTransaction);

    const expectedBlockTime = 3000; // 3sec

    const sleep = (milliseconds) => {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    };

    let transReceipt = null;
    while (transReceipt == null) {
      transReceipt = await web3connect.eth.getTransactionReceipt(
        txrec.transactionHash
      );
      await sleep(expectedBlockTime);
    }

    if (transReceipt.status) {
      return transReceipt;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  ERC20Transfer,
};
