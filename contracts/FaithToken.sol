// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FaithToken
 * @dev Implementation of the Faith token for the pray.fun game with batch processing
 */
contract FaithToken is ERC20, Ownable {
    // Each prayer action gives 1 token
    uint256 public constant TOKENS_PER_PRAYER = 1 * 10**18;
    uint256 public constant MAX_SUPPLY = 666_666_666 * 10**18;
    uint256 public totalMined = 0;
    
    // Track individual prayer stats
    mapping(address => uint256) public prayerStats;
    
    // Batch processor address
    address public batchProcessor;
    
    // Events
    event PrayerProcessed(address indexed user, uint256 amount, uint256 timestamp);
    event BatchProcessed(uint256 userCount, uint256 totalAmount, uint256 timestamp);
    
    /**
     * @dev Constructor that initializes the token with name, symbol and mints the entire supply to the contract
     */
    constructor() ERC20("Faith", "FAITH") Ownable(msg.sender) {
        // Initialize contract with total supply
        _mint(address(this), MAX_SUPPLY);
    }
    
    /**
     * @dev Set the batch processor address
     * @param _batchProcessor The address of the batch processor
     */
    function setBatchProcessor(address _batchProcessor) external onlyOwner {
        batchProcessor = _batchProcessor;
    }
    
    /**
     * @dev Process a single prayer for a user
     * @param user The address of the user to process prayer for
     */
    function processPrayer(address user) external {
        require(msg.sender == batchProcessor, "Only batch processor can process prayers");
        require(totalMined < MAX_SUPPLY, "All faith has been mined");
        
        // Transfer 1 token to user
        _transfer(address(this), user, TOKENS_PER_PRAYER);
        
        // Update stats
        totalMined += TOKENS_PER_PRAYER;
        prayerStats[user] += TOKENS_PER_PRAYER;
        
        // Emit event
        emit PrayerProcessed(user, TOKENS_PER_PRAYER, block.timestamp);
    }
    
    /**
     * @dev Process a batch of prayers for multiple users
     * @param users Array of user addresses
     * @param amounts Array of token amounts (must be in TOKENS_PER_PRAYER increments)
     */
    function processBatch(address[] calldata users, uint256[] calldata amounts) external {
        require(msg.sender == batchProcessor, "Only batch processor can process prayers");
        require(users.length == amounts.length, "Arrays must be same length");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < users.length; i++) {
            require(totalMined + totalAmount + amounts[i] <= MAX_SUPPLY, "Would exceed max supply");
            
            // Transfer tokens to user
            _transfer(address(this), users[i], amounts[i]);
            
            // Update user stats
            prayerStats[users[i]] += amounts[i];
            
            // Track batch total
            totalAmount += amounts[i];
            
            // Emit individual prayer processed event
            emit PrayerProcessed(users[i], amounts[i], block.timestamp);
        }
        
        // Update total mined
        totalMined += totalAmount;
        
        // Emit batch processed event
        emit BatchProcessed(users.length, totalAmount, block.timestamp);
    }
    
    /**
     * @dev Returns the total amount of tokens prayed for by a specific address
     * @param user The address to check
     * @return The amount of tokens prayed for by the address
     */
    function getPrayerStats(address user) external view returns (uint256) {
        return prayerStats[user];
    }
    
    /**
     * @dev Returns the amount of tokens that remain to be mined
     * @return The remaining supply available for prayers
     */
    function getRemainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMined;
    }
}