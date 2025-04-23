// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title KarmaToken
 * @dev Implementation of a minable ERC20 token for the pray.fun game
 */
contract KarmaToken is ERC20 {
    // Each prayer action gives 10K tokens
    uint256 public constant TOKENS_PER_MINE = 10_000 * 10**18;
    uint256 public constant MAX_SUPPLY = 77_770_000 * 10**18;
    uint256 public totalMined = 0;
    
    // Track individual prayer stats
    mapping(address => uint256) public minerStats;
    
    /**
     * @dev Constructor that initializes the token with name, symbol and mints the entire supply to the contract
     */
    constructor() ERC20("Karma", "KARMA") {
        // Initialize contract with total supply
        _mint(address(this), MAX_SUPPLY);
    }
    
    /**
     * @dev Mine function that transfers TOKENS_PER_MINE to the caller
     * Reverts if all tokens have been mined
     */
    function mine() external {
        require(totalMined < MAX_SUPPLY, "All karma has been mined");
        
        // Transfer 10K tokens to user
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