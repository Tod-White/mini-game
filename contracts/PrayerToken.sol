// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title PrayerToken
 * @dev Implementation of a minable ERC20 token that can be deployed by users
 */
contract PrayerToken is ERC20 {
    // Each prayer action gives 1,000 tokens
    uint256 public constant TOKENS_PER_MINE = 1_000 * 10**18;
    uint256 public immutable MAX_SUPPLY;
    uint256 public totalMined = 0;
    
    // Track individual prayer stats
    mapping(address => uint256) public minerStats;
    
    // Creator address
    address public creator;
    uint256 public creationTimestamp;
    
    /**
     * @dev Constructor that initializes the token with name, symbol, total supply and assigns creator
     * @param tokenName Name for the new token
     * @param tokenSymbol Symbol for the new token
     * @param maxSupply Maximum supply for the token (in tokens, not wei)
     * @param tokenCreator Address of the token creator
     */
    constructor(
        string memory tokenName, 
        string memory tokenSymbol,
        uint256 maxSupply,
        address tokenCreator
    ) ERC20(tokenName, tokenSymbol) {
        // Convert maxSupply to wei (with 18 decimals)
        MAX_SUPPLY = maxSupply * 10**18;
        
        // Initialize contract with total supply
        _mint(address(this), MAX_SUPPLY);
        
        // Set creator and timestamp
        creator = tokenCreator;
        creationTimestamp = block.timestamp;
    }
    
    /**
     * @dev Mine function that transfers TOKENS_PER_MINE to the caller
     * Reverts if all tokens have been mined
     */
    function mine() external {
        require(totalMined < MAX_SUPPLY, "All tokens have been mined");
        
        // Calculate how many tokens to transfer (either TOKENS_PER_MINE or remaining supply)
        uint256 transferAmount = TOKENS_PER_MINE;
        if (totalMined + TOKENS_PER_MINE > MAX_SUPPLY) {
            transferAmount = MAX_SUPPLY - totalMined;
        }
        
        // Transfer tokens to user
        _transfer(address(this), msg.sender, transferAmount);
        
        // Update stats
        totalMined += transferAmount;
        minerStats[msg.sender] += transferAmount;
        
        // Emit event
        emit Mining(msg.sender, transferAmount, block.timestamp);
        
        // If this was the last mining, emit exhausted event
        if (totalMined >= MAX_SUPPLY) {
            emit MiningExhausted(totalMined, block.timestamp);
        }
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
    
    /**
     * @dev Returns creation details for the token
     * @return Creator's address and creation timestamp
     */
    function getCreationDetails() external view returns (address, uint256) {
        return (creator, creationTimestamp);
    }
    
    // Events
    event Mining(address indexed miner, uint256 amount, uint256 timestamp);
    event MiningExhausted(uint256 totalMined, uint256 timestamp);
} 