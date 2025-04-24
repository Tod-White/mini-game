const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy FaithToken
  const FaithToken = await ethers.getContractFactory("FaithToken");
  const faithToken = await FaithToken.deploy();
  await faithToken.deployed();
  console.log("FaithToken deployed to:", faithToken.address);

  // Deploy BatchProcessor
  const BatchProcessor = await ethers.getContractFactory("BatchProcessor");
  const batchProcessor = await BatchProcessor.deploy(faithToken.address);
  await batchProcessor.deployed();
  console.log("BatchProcessor deployed to:", batchProcessor.address);

  // Set BatchProcessor in FaithToken
  const setTx = await faithToken.setBatchProcessor(batchProcessor.address);
  await setTx.wait();
  console.log("BatchProcessor set in FaithToken");

  // Save deployment addresses to .env file
  updateEnvFile({
    FAITH_TOKEN_ADDRESS: faithToken.address,
    BATCH_PROCESSOR_ADDRESS: batchProcessor.address
  });

  console.log("Deployment complete");
}

function updateEnvFile(newValues) {
  const envFilePath = path.resolve(__dirname, "../.env");
  let envContent = "";

  // Read existing .env file if it exists
  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, "utf8");
  }

  // Parse existing content into a key-value object
  const envVars = envContent
    .split("\n")
    .filter(line => line.trim() !== "")
    .reduce((acc, line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {});

  // Update with new values
  Object.assign(envVars, newValues);

  // Convert back to string
  const newEnvContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // Write back to .env file
  fs.writeFileSync(envFilePath, newEnvContent);
  console.log("Updated .env file with contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });