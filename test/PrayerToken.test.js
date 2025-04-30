const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrayerToken", function () {
  let PrayerToken;
  let prayerToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const tokenName = "Test Prayer Token";
  const tokenSymbol = "TPT";
  const totalSupply = 1000000; // 1 million tokens

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    PrayerToken = await ethers.getContractFactory("PrayerToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy a new PrayerToken contract before each test
    prayerToken = await PrayerToken.deploy(
      tokenName,
      tokenSymbol,
      totalSupply,
      owner.address
    );
  });

  describe("Deployment", function () {
    it("Should set the right token name and symbol", async function () {
      expect(await prayerToken.name()).to.equal(tokenName);
      expect(await prayerToken.symbol()).to.equal(tokenSymbol);
    });

    it("Should set the right max supply", async function () {
      const expectedMaxSupply = ethers.parseUnits(totalSupply.toString(), 18);
      expect(await prayerToken.MAX_SUPPLY()).to.equal(expectedMaxSupply);
    });

    it("Should assign the total supply to the contract itself", async function () {
      const contractBalance = await prayerToken.balanceOf(await prayerToken.getAddress());
      expect(contractBalance).to.equal(await prayerToken.MAX_SUPPLY());
    });

    it("Should set the right creator", async function () {
      const [creator, timestamp] = await prayerToken.getCreationDetails();
      expect(creator).to.equal(owner.address);
      expect(timestamp).to.be.gt(0);
    });
  });

  describe("Mining", function () {
    it("Should allow users to mine tokens", async function () {
      // Check initial state
      expect(await prayerToken.balanceOf(addr1.address)).to.equal(0);
      
      // Mine tokens with addr1
      await prayerToken.connect(addr1).mine();
      
      // Check balance after mining
      const tokensPerMine = await prayerToken.TOKENS_PER_MINE();
      expect(await prayerToken.balanceOf(addr1.address)).to.equal(tokensPerMine);
      
      // Check stats
      expect(await prayerToken.minerStats(addr1.address)).to.equal(tokensPerMine);
      expect(await prayerToken.totalMined()).to.equal(tokensPerMine);
    });

    it("Should track mining stats correctly", async function () {
      // Mine multiple times with different addresses
      await prayerToken.connect(addr1).mine();
      await prayerToken.connect(addr2).mine();
      await prayerToken.connect(addr1).mine();
      
      const tokensPerMine = await prayerToken.TOKENS_PER_MINE();
      
      // Check individual stats
      expect(await prayerToken.getMinerStats(addr1.address)).to.equal(tokensPerMine * 2n);
      expect(await prayerToken.getMinerStats(addr2.address)).to.equal(tokensPerMine);
      
      // Check total mined
      expect(await prayerToken.totalMined()).to.equal(tokensPerMine * 3n);
      
      // Check remaining supply
      const maxSupply = await prayerToken.MAX_SUPPLY();
      expect(await prayerToken.getRemainingSupply()).to.equal(maxSupply - (tokensPerMine * 3n));
    });

    it("Should revert when all tokens have been mined", async function () {
      // Create a token with very small supply
      const smallToken = await PrayerToken.deploy(
        "Small Token",
        "SMALL",
        1, // Just 1 token total supply
        owner.address
      );
      
      // Mine the token (should work for first mining)
      await smallToken.connect(addr1).mine();
      
      // Second mining should fail
      await expect(smallToken.connect(addr2).mine()).to.be.revertedWith("All tokens have been mined");
    });

    it("Should handle partial mining for last tokens", async function () {
      // Create a token with supply just over 1 TOKENS_PER_MINE
      const tokensPerMine = 1000n * 10n**18n;
      const partialToken = await PrayerToken.deploy(
        "Partial Token",
        "PART",
        1001, // 1001 tokens (just 1 more than TOKENS_PER_MINE)
        owner.address
      );
      
      // First mine should be full amount
      await partialToken.connect(addr1).mine();
      expect(await partialToken.balanceOf(addr1.address)).to.equal(tokensPerMine);
      
      // Second mine should only get the remaining 1 token
      await partialToken.connect(addr2).mine();
      expect(await partialToken.balanceOf(addr2.address)).to.equal(1n * 10n**18n); // Just 1 token
      
      // Check total mined equals max supply
      expect(await partialToken.totalMined()).to.equal(await partialToken.MAX_SUPPLY());
      
      // Third mine should fail
      await expect(partialToken.connect(addr1).mine()).to.be.revertedWith("All tokens have been mined");
    });
  });
}); 