const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // The factory contract address on Somnia testnet
  const FACTORY_ADDRESS = "0x178465595D9fDc350D28DEf432ad8684F1de48A5";
  
  // New burn amount (in wei) - change this to your desired amount
  // Example: for 3,000 FAITH tokens (with 18 decimals)
  const NEW_BURN_AMOUNT = ethers.parseEther("3000");
  
  // Get the signer (account that will execute the transaction)
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Get the factory contract
  const factoryABI = [
    "function setRequiredBurnAmount(uint256 newBurnAmount) external",
    "function requiredBurnAmount() external view returns (uint256)",
    "function owner() external view returns (address)"
  ];
  
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);
  
  // Check if the signer is the owner
  const owner = await factory.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error(`Error: The signer ${signer.address} is not the owner of the factory contract.`);
    console.error(`Current owner is: ${owner}`);
    return;
  }
  
  // Get current burn amount
  const currentBurnAmount = await factory.requiredBurnAmount();
  console.log(`Current burn amount: ${ethers.formatEther(currentBurnAmount)} FAITH`);
  
  // Set new burn amount
  console.log(`Setting new burn amount to: ${ethers.formatEther(NEW_BURN_AMOUNT)} FAITH`);
  const tx = await factory.setRequiredBurnAmount(NEW_BURN_AMOUNT);
  console.log(`Transaction sent: ${tx.hash}`);
  
  // Wait for transaction to be mined
  await tx.wait();
  console.log(`Transaction confirmed!`);
  
  // Verify the new burn amount
  const newBurnAmount = await factory.requiredBurnAmount();
  console.log(`New burn amount set to: ${ethers.formatEther(newBurnAmount)} FAITH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 