import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import solc from "solc";

// Manually define __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractPath = path.resolve(__dirname, "contracts", "upload.sol");
const source = fs.readFileSync(contractPath, "utf8");
const input = {
  language: "Solidity",
  sources: {
    "upload.sol": { content: source }
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"]
      }
    }
  }
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));

const contractName = Object.keys(output.contracts["upload.sol"])[0]; 
const compiledContract = output.contracts["upload.sol"][contractName];

 const abi = compiledContract.abi;
 const bytecode = compiledContract.evm.bytecode.object;
// module.exports = {
//   abi: compiledContract.abi,
//   bytecode: compiledContract.evm.bytecode.object
// };
export { abi, bytecode };
