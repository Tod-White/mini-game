const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrayerTokenFactory", function () {
  let FaithToken;
  let faithToken;
  let PrayerTokenFactory;
  let factory;
  let PrayerToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // Using raw string for 5000 ether which will be converted to wei
  const burnAmountEther = "5000"; 
  let burnAmount;

  beforeEach(async function () {
    // Convert the burn amount to wei once here
    burnAmount = ethers.parseUnits(burnAmountEther, 18);

    // Get the ContractFactories and Signers
    FaithToken = await ethers.getContractFactory("FaithToken");
    PrayerTokenFactory = await ethers.getContractFactory("PrayerTokenFactory");
    PrayerToken = await ethers.getContractFactory("PrayerToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the FaithToken contract
    faithToken = await FaithToken.deploy();
    
    // Mine some FAITH tokens for testing
    await faithToken.connect(addr1).mine();
    await faithToken.connect(addr1).mine();
    await faithToken.connect(addr1).mine();
    await faithToken.connect(addr1).mine();
    await faithToken.connect(addr1).mine();
    await faithToken.connect(addr1).mine(); // Mine 6 times to get 6,000 tokens
    
    // Mine some FAITH tokens for addr2 as well
    await faithToken.connect(addr2).mine();
    await faithToken.connect(addr2).mine();
    await faithToken.connect(addr2).mine();
    await faithToken.connect(addr2).mine();
    await faithToken.connect(addr2).mine();
    await faithToken.connect(addr2).mine();

    // Deploy the factory with the FaithToken address
    factory = await PrayerTokenFactory.deploy(await faithToken.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the correct FAITH token address", async function () {
      expect(await factory.faithToken()).to.equal(await faithToken.getAddress());
    });

    it("Should set the correct initial burn amount", async function () {
      expect(await factory.requiredBurnAmount()).to.equal(burnAmount);
    });

    it("Should set the correct owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });
  });

  describe("Token Deployment", function () {
    it("Should revert if user does not approve FAITH tokens", async function () {
      await expect(
        factory.connect(addr1).createToken("Test Token", "TEST", 1000000)
      ).to.be.revertedWith("Insufficient FAITH token allowance");
    });

    it("Should revert if user does not have enough FAITH tokens", async function () {
      // Approve the tokens first
      await faithToken.connect(owner).approve(await factory.getAddress(), burnAmount);
      
      // Try to deploy - should fail since owner has no FAITH tokens
      await expect(
        factory.connect(owner).createToken("Test Token", "TEST", 1000000)
      ).to.be.revertedWith("Insufficient FAITH token balance");
    });

    it("Should create a new token when all requirements are met", async function () {
      // Approve FAITH tokens
      await faithToken.connect(addr1).approve(await factory.getAddress(), burnAmount);
      
      // Initial state
      const initialCount = await factory.getDeployedTokenCount();
      const initialBalance = await faithToken.balanceOf(addr1.address);
      
      // Create token
      const tx = await factory.connect(addr1).createToken("Test Token", "TEST", 1000000);
      const receipt = await tx.wait();
      
      // Get the token address from the event
      const event = receipt.logs.find(log => 
        log.topics[0] === ethers.id("TokenDeployed(address,string,string,address,uint256,uint256)")
      );
      const tokenAddress = ethers.dataSlice(event.topics[1], 12); // Extract the address from the first indexed parameter
      
      // Check token count increased
      expect(await factory.getDeployedTokenCount()).to.equal(initialCount + 1n);
      
      // Check FAITH tokens were burned
      expect(await faithToken.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
      
      // Get the token and check its properties
      const tokenInfo = await factory.getTokenByIndex(0);
      expect(tokenInfo.name).to.equal("Test Token");
      expect(tokenInfo.symbol).to.equal("TEST");
      expect(tokenInfo.creator).to.equal(addr1.address);
      expect(tokenInfo.totalSupply).to.equal(ethers.parseUnits("1000000", 18));
      
      // Check the actual token contract
      const deployedToken = await PrayerToken.attach(tokenInfo.tokenAddress);
      expect(await deployedToken.name()).to.equal("Test Token");
      expect(await deployedToken.symbol()).to.equal("TEST");
      const [creator, _] = await deployedToken.getCreationDetails();
      expect(creator).to.equal(addr1.address);
    });

    it("Should track multiple deployed tokens", async function () {
      // Approve FAITH tokens for both users
      await faithToken.connect(addr1).approve(await factory.getAddress(), burnAmount);
      await faithToken.connect(addr2).approve(await factory.getAddress(), burnAmount);
      
      // Deploy first token
      await factory.connect(addr1).createToken("Token1", "TKN1", 1000000);
      
      // Deploy second token
      await factory.connect(addr2).createToken("Token2", "TKN2", 2000000);
      
      // Check token count
      expect(await factory.getDeployedTokenCount()).to.equal(2n);
      
      // Check first token
      const token1 = await factory.getTokenByIndex(0);
      expect(token1.name).to.equal("Token1");
      expect(token1.creator).to.equal(addr1.address);
      
      // Check second token
      const token2 = await factory.getTokenByIndex(1);
      expect(token2.name).to.equal("Token2");
      expect(token2.creator).to.equal(addr2.address);
      
      // Check tokens by creator
      const addr1Tokens = await factory.getTokensByCreator(addr1.address);
      expect(addr1Tokens.length).to.equal(1);
      expect(addr1Tokens[0].name).to.equal("Token1");
      
      const addr2Tokens = await factory.getTokensByCreator(addr2.address);
      expect(addr2Tokens.length).to.equal(1);
      expect(addr2Tokens[0].name).to.equal("Token2");
    });
  });

  describe("Factory Management", function () {
    it("Should allow owner to change the burn amount", async function () {
      const newBurnAmount = ethers.parseUnits("10000", 18); // 10,000 FAITH tokens
      
      // Change burn amount
      await factory.connect(owner).setRequiredBurnAmount(newBurnAmount);
      
      // Check the new amount
      expect(await factory.requiredBurnAmount()).to.equal(newBurnAmount);
      
      // Test that the new amount is enforced
      await faithToken.connect(addr1).approve(await factory.getAddress(), burnAmount); // Only approve old amount
      
      // Try to deploy - should fail due to insufficient allowance
      await expect(
        factory.connect(addr1).createToken("Test Token", "TEST", 1000000)
      ).to.be.revertedWith("Insufficient FAITH token allowance");
      
      // Approve the new amount
      await faithToken.connect(addr1).approve(await factory.getAddress(), newBurnAmount);
      
      // Should succeed now
      await factory.connect(addr1).createToken("Test Token", "TEST", 1000000);
    });

    it("Should not allow non-owners to change the burn amount", async function () {
      const newBurnAmount = ethers.parseUnits("10000", 18);
      
      // Try to change burn amount as non-owner
      await expect(
        factory.connect(addr1).setRequiredBurnAmount(newBurnAmount)
      ).to.be.revertedWithCustomError(
        factory,
        "OwnableUnauthorizedAccount"
      );
      
      // Check that the amount didn't change
      expect(await factory.requiredBurnAmount()).to.equal(burnAmount);
    });
  });
}); 