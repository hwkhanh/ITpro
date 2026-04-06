const { ethers } = require('ethers');
const fs = require('fs');

async function test() {
  try {
    const ABI = JSON.parse(fs.readFileSync('C:/ITpro/src/lib/NFT_ABI.json', 'utf8'));
    const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
    const contract = new ethers.Contract('0x336c028DC08aC4FE8424c6F8dFA91b57cd987283', ABI, provider);
    
    console.log("Estimating gas for mint...");
    const randomAddress = '0x1111111111111111111111111111111111111111';
    await contract.mint.estimateGas("ipfs://test", { from: randomAddress });
    console.log("Gas estimation succeeded!");
  } catch (err) {
    console.error("Failed to estimate gas:", err.reason || err.shortMessage || err.message);
  }
}
test();
