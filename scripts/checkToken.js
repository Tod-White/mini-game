const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x7B0DF87125aa3c1f46e57cB4f1bB80d67cEC7d52";
  console.log("Checking token at address:", tokenAddress);

  // Get the token contract
  const Token = await hre.ethers.getContractAt("MineableToken", tokenAddress);

  try {
    // Get basic token info
    const [name, symbol, totalSupply, tokensPerPrayer] = await Promise.all([
      Token.name(),
      Token.symbol(),
      Token.totalSupply(),
      Token.tokensPerPrayer()
    ]);

    // Format values to show actual token amounts
    const formattedTotalSupply = parseFloat(hre.ethers.formatUnits(totalSupply, 18)).toLocaleString();
    const formattedTokensPerPrayer = parseFloat(hre.ethers.formatUnits(tokensPerPrayer, 18));

    console.log("\nToken Details:");
    console.log("-------------");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Total Supply:", formattedTotalSupply, "tokens");
    console.log("Tokens Per Prayer:", formattedTokensPerPrayer, "tokens");

    // Get mining stats
    const remainingSupply = await Token.getRemainingSupply();
    const totalMined = totalSupply - remainingSupply;
    
    const formattedRemaining = parseFloat(hre.ethers.formatUnits(remainingSupply, 18)).toLocaleString();
    const formattedMined = parseFloat(hre.ethers.formatUnits(totalMined, 18)).toLocaleString();
    
    console.log("\nMining Status:");
    console.log("-------------");
    console.log("Remaining Supply:", formattedRemaining, "tokens");
    console.log("Total Mined:", formattedMined, "tokens");
    console.log("Mining Progress:", (Number(totalMined) * 100 / Number(totalSupply)).toFixed(2) + "%");

  } catch (error) {
    console.error("Error checking token:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 