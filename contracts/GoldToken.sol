// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title GoldToken
 * @dev Implementation of a minable ERC20 token for the mine.fun game
 */
contract GoldToken is ERC20 {
    // Each mining action gives 1M tokens
    uint256 public constant TOKENS_PER_MINE = 1_000_000 * 10**18;
    uint256 public constant MAX_SUPPLY = 420_000_000 * 10**18;
    uint256 public totalMined = 0;
    
    // Track individual mining stats
    mapping(address => uint256) public minerStats;
    
    /**
     * @dev Constructor that initializes the token with name, symbol and mints the entire supply to the contract
     */
    constructor() ERC20("Gold Token", "GOLD") {
        // Initialize contract with total supply
        _mint(address(this), MAX_SUPPLY);
    }
    
    /**
     * @dev Mine function that transfers TOKENS_PER_MINE to the caller
     * Reverts if all tokens have been mined
     */
    function mine() external {
        require(totalMined < MAX_SUPPLY, "All gold has been mined");
        
        // Transfer 1M tokens to miner
        _transfer(address(this), msg.sender, TOKENS_PER_MINE);
        
        // Update stats
        totalMined += TOKENS_PER_MINE;
        minerStats[msg.sender] += TOKENS_PER_MINE;
    }
    
    /**
     * @dev Returns the total amount of tokens mined by a specific address
     * @param miner The address to check
     * @return The amount of tokens mined by the address
     */
    function getMinerStats(address miner) external view returns (uint256) {
        return minerStats[miner];
    }
    
    /**
     * @dev Returns the amount of tokens that remain to be mined
     * @return The remaining supply available for mining
     */
    function getRemainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMined;
    }
}