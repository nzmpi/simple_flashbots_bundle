const { ethers } = require("ethers");
const { v4: uuidv4 } = require('uuid')
const {
  FlashbotsBundleProvider,
} = require("@flashbots/ethers-provider-bundle");
require('dotenv').config();

const bundleUUID = uuidv4();
console.log("bundleUUID = ", bundleUUID);
const network = "mainnet"; // change to goelri for testing
const APIKEY = process.env.INFURA_API_KEY; 
const provider = new ethers.providers.InfuraProvider(network, APIKEY);

const PRIVATEKEY_SPONSOR = process.env.PRIVATE_KEY_SPONSOR;
const wallet_sponsor = new ethers.Wallet(PRIVATEKEY_SPONSOR, provider);
console.log("addr wallet spon = ", wallet_sponsor.address);

const PRIVATEKEY_COMPROMISED = process.env.PRIVATE_KEY_COMPROMISED;
const wallet_compromised = new ethers.Wallet(PRIVATEKEY_COMPROMISED, provider);
console.log("addr wallet comp = ", wallet_compromised.address);

const authSigner = wallet_sponsor;
console.log("addr auth = ", authSigner.address);

let blockNumber;
let bundleHash;
async function sendTransactions() {
  // should change for testing
  // https://docs.flashbots.net/flashbots-auction/advanced/testnets
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    authSigner,
    `https://relay.flashbots.net?bundle=${bundleUUID}`
  );

  const nonce = await provider.getTransactionCount(wallet_compromised.address);
  const maxFeePerGas = 20n * 10n ** 9n; // base + priority fees
  const maxPriorityFeePerGas = 10n * 10n ** 9n; // priority fee
  const ENS = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85';
  const stream = '0xD0dd53B2DEe7060fE803C70a8F3e5858A968FF03';

  const transactionBundle = [
    { // sponsor transfer
      signer: wallet_sponsor,
      transaction: {
        type: 2,
        chainId: 1,
        nonce: await provider.getTransactionCount(wallet_sponsor.address),
        value: ethers.utils.parseEther('0.0023'),
        data: '0x',
        gasLimit: 21000,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        to: wallet_compromised.address,
      },
    },
    { // ens transfer
      signer: wallet_compromised,
      transaction: {
        type: 2,
        chainId: 1,
        nonce: nonce,
        value: 0,
        data: '0x42842e0e00000000000000000000000002d09e69e528d7da14f32cd21b55affa1ff7f873000000000000000000000000abd10f0a61270d6977c5bfd9d4ec74d6d3bc96ab26ce1026500011c11357170436770fd3bb3d96fb909da0235900d271b1dba2b3',
        gasLimit: 70000,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        to: ENS,
      },
    },
    { // stream withdraw
      signer: wallet_compromised,
      transaction: {
        type: 2,
        chainId: 1,
        nonce: nonce + 1,
        value: 0,
        data: '0xa8397ddc00000000000000000000000000000000000000000000000006f05b59d3b200000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000c666c617368626f7474696e670000000000000000000000000000000000000000',
        gasLimit: 50000,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        to: stream,
      },
    },
    { // stream transfer
      signer: wallet_compromised,
      transaction: {
        type: 2,
        chainId: 1,
        nonce: nonce + 2,
        value: ethers.utils.parseEther('0.5'),
        data: '0x',
        gasLimit: 21000,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        to: wallet_sponsor.address,
      },
    },
  ];

  const signedTransactions = await flashbotsProvider.signBundle(transactionBundle);

  blockNumber = await provider.getBlockNumber();
  console.log("current blockNumber = ", blockNumber);

  let simulation;
  for (var i = 1; i <= 20; i++) {
    simulation = await flashbotsProvider.simulate(
      signedTransactions,
      blockNumber + i
    );
  
    if ("error" in simulation) {
      console.log(`Simulation Error: ${simulation.error.message}`);
    } else {
      /*console.log(
        `Simulation Success: ${blockNumber} ${JSON.stringify(
          simulation,
          null,
          2
        )}`
      );*/
      console.log(`Simulation Success: ${blockNumber + i}`);
    }
  }

  bundleHash = simulation.bundleHash;
  console.log("bundle hash: ", bundleHash);

  for (var i = 1; i <= 20; i++) {
    const flashbotsTransactionResponse = await flashbotsProvider.sendBundle(
      transactionBundle,
      blockNumber + i,
    );
    console.log("submitted for block #", blockNumber + i);
  }
  //console.log("Response = ", await flashbotsTransactionResponse.simulate());
  console.log("bundles submitted");
}

async function checkBundle() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    authSigner,
    `https://relay.flashbots.net?bundle=${bundleUUID}`
  );

  for (var i = 1; i <= 20; i++) {
    const stats = await flashbotsProvider.getBundleStatsV2(
      bundleHash,
      blockNumber + i
    );
    console.log("block number #", blockNumber + i);
    console.log("isSimulated: ", stats.isSimulated);
    if (stats.sealedByBuildersAt) {
      console.log("sealedByBuildersAt: ", stats.sealedByBuildersAt[0]);
    }
  }
}

async function main() {
  await sendTransactions();
  await checkBundle();
}

main();