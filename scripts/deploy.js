const hre = require("hardhat");

async function main() {
  console.log("Deploying TokenFactory...");

  // Deploy TokenFactory
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const factory = await TokenFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("TokenFactory deployed to:", factoryAddress);

  // Verify the contract on the block explorer (if supported)
  try {
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.log("Verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 