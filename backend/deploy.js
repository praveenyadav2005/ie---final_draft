import HDWalletProvider from '@truffle/hdwallet-provider';
import Web3 from 'web3';
import fs from 'fs';
import { abi, bytecode } from './compile.js';
import dotenv from 'dotenv';
dotenv.config();

export const provider = new HDWalletProvider(
  process.env.MNEMONIC,
  `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log('Attempting to deploy from account', accounts[0]);

  const estimatedGas = await new web3.eth.Contract(abi)
  .deploy({ data: bytecode })
  .estimateGas();
console.log('Estimated Gas:', estimatedGas);

  const result = await new web3.eth.Contract(abi)  
    .deploy({ data: bytecode })
    .send({ gas: estimatedGas, from: accounts[0] });

  console.log("Contract deployed to", result.options.address);

  const contractData = {
    address: result.options.address,
    abi
  };

  fs.writeFileSync('../drive/src/contract.json', JSON.stringify(contractData, null, 2));
  provider.engine.stop();
};

deploy();
