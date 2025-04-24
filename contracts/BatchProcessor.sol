// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FaithToken.sol";

/**
 * @title BatchProcessor
 * @dev Contract for processing batched prayer requests for the Faith token
 */
contract BatchProcessor is Ownable {
    // Faith token contract
    FaithToken public faithToken;
    
    // Maximum batch size
    uint256 public constant MAX_BATCH_SIZE = 100;
    
    // Events
    event BatchSubmitted(uint256 userCount, uint256 totalAmount, uint256 timestamp);
    
    /**
     * @dev Constructor sets the Faith token contract address
     * @param _faithToken Address of the Faith token contract
     */
    constructor(address _faithToken) Ownable(msg.sender) {
        faithToken = FaithToken(_faithToken);
    }
    
    /**
     * @dev Update the Faith token contract address
     * @param _faithToken New address of the Faith token contract
     */
    function setFaithToken(address _faithToken) external onlyOwner {
        faithToken = FaithToken(_faithToken);
    }
    
    /**
     * @dev Process a batch of prayers
     * @param users Array of user addresses
     * @param amounts Array of token amounts
     */
    function processBatch(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(users.length == amounts.length, "Arrays must be same length");
        require(users.length <= MAX_BATCH_SIZE, "Batch too large");
        
        // Calculate total amount for event
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        // Process the batch through the Faith token contract
        faithToken.processBatch(users, amounts);
        
        // Emit event
        emit BatchSubmitted(users.length, totalAmount, block.timestamp);
    }
}