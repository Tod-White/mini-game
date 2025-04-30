// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
const { ethers } = require("hardhat");

async function main() {
  // Get the FAITH token address
  const faithTokenAddress = process.env.FAITH_TOKEN_ADDRESS;
  
  if (!faithTokenAddress) {
    console.error("FAITH_TOKEN_ADDRESS not set in environment variables");
    process.exit(1);
  }
  
  console.log("Deploying PrayerTokenFactory with FAITH token address:", faithTokenAddress);

  // Deploy the PrayerTokenFactory contract
  const PrayerTokenFactory = await ethers.getContractFactory("PrayerTokenFactory");
  const factory = await PrayerTokenFactory.deploy(faithTokenAddress);

  console.log("Waiting for deployment...");
  await factory.deploymentTransaction().wait();

  console.log("PrayerTokenFactory deployed to:", factory.target);
  console.log("Burn amount:", ethers.formatEther(await factory.requiredBurnAmount()), "FAITH");
  
  console.log("\nVerify contract:");
  console.log("npx hardhat verify --network somnia-testnet", factory.target, faithTokenAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 