# Simple Flashbots Bundle

Simple flashbots bundle allows you to retrive your ENS name and your funds from a stream

# How to use

1. Run `yarn add hardhat`

2. Add your Infura key and private keys to `.env` file

3. Change `maxFeePerGas` and `maxPriorityFeePerGas` based on current network

 - Put high `maxPriorityFeePerGas` so it gets accepted

4. Change your stream address and the `data` field

 - You can get right `data` by calling a contract you want and copy `hex data` of your call.

5. `Simulate` your transactions to check if they work 

 - Open (this)[https://github.com/nzmpi/simple_flashbots_bundle/blob/master/flashbotting.js#L116-L121] lines and close (this)[https://github.com/nzmpi/simple_flashbots_bundle/blob/master/flashbotting.js#L130-L136] ones while testing your transactions

6. Run `node flashbotting.js`

# Usage

You can call any contract and add as many transactions as you want.

For that you need to change the `data`, `to` and `gasLimit` fields. The latter value you can get with `simulate`.