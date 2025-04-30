// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./PrayerToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrayerTokenFactory
 * @dev Factory contract for deploying new prayer tokens while burning FAITH tokens
 */
contract PrayerTokenFactory is Ownable {
    // FAITH token interface
    IERC20 public faithToken;
    
    // Amount of FAITH tokens required to burn for deployment (5,000 tokens)
    uint256 public requiredBurnAmount = 5_000 * 10**18;
    
    // Dead address for burning (not exactly zero address to avoid transfer errors)
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Deployed tokens registry
    struct TokenInfo {
        string name;
        string symbol;
        address tokenAddress;
        address creator;
        uint256 totalSupply;
        uint256 timestamp;
    }
    
    TokenInfo[] public deployedTokens;
    
    // Mapping from token address to index in deployedTokens array + 1 (0 means not found)
    mapping(address => uint256) public tokenIndexes;
    
    // Events
    event TokenDeployed(
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed creator,
        uint256 totalSupply,
        uint256 timestamp
    );
    
    event BurnAmountChanged(uint256 oldAmount, uint256 newAmount);
    
    /**
     * @dev Constructor that sets the FAITH token address and owner
     * @param _faithToken Address of the FAITH token contract
     */
    constructor(address _faithToken) {
        faithToken = IERC20(_faithToken);
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Creates a new prayer token
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @param totalSupply Total supply of the token (in tokens, not wei)
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) external returns (address) {
        // Check if user has approved the factory to spend their FAITH tokens
        require(
            faithToken.allowance(msg.sender, address(this)) >= requiredBurnAmount,
            "Insufficient FAITH token allowance"
        );
        
        // Check if user has enough FAITH tokens
        require(
            faithToken.balanceOf(msg.sender) >= requiredBurnAmount,
            "Insufficient FAITH token balance"
        );
        
        // Transfer and burn FAITH tokens
        require(
            faithToken.transferFrom(msg.sender, BURN_ADDRESS, requiredBurnAmount),
            "FAITH token burn failed"
        );
        
        // Deploy new token
        PrayerToken newToken = new PrayerToken(
            name,
            symbol,
            totalSupply,
            msg.sender
        );
        
        // Add to registry
        TokenInfo memory info = TokenInfo({
            name: name,
            symbol: symbol,
            tokenAddress: address(newToken),
            creator: msg.sender,
            totalSupply: totalSupply * 10**18, // Convert to wei for consistency
            timestamp: block.timestamp
        });
        
        deployedTokens.push(info);
        tokenIndexes[address(newToken)] = deployedTokens.length;
        
        // Emit event
        emit TokenDeployed(
            address(newToken),
            name,
            symbol,
            msg.sender,
            totalSupply * 10**18,
            block.timestamp
        );
        
        return address(newToken);
    }
    
    /**
     * @dev Returns the number of deployed tokens
     */
    function getDeployedTokenCount() external view returns (uint256) {
        return deployedTokens.length;
    }
    
    /**
     * @dev Returns token info for a specific index
     * @param index Index in the deployedTokens array
     */
    function getTokenByIndex(uint256 index) external view returns (TokenInfo memory) {
        require(index < deployedTokens.length, "Token index out of bounds");
        return deployedTokens[index];
    }
    
    /**
     * @dev Returns token info for a specific address
     * @param tokenAddress Address of the token
     */
    function getTokenByAddress(address tokenAddress) external view returns (TokenInfo memory) {
        uint256 index = tokenIndexes[tokenAddress];
        require(index > 0, "Token not found");
        return deployedTokens[index - 1];
    }
    
    /**
     * @dev Returns tokens created by a specific address
     * @param creator Creator address
     */
    function getTokensByCreator(address creator) external view returns (TokenInfo[] memory) {
        // First, count tokens by this creator
        uint256 count = 0;
        for (uint256 i = 0; i < deployedTokens.length; i++) {
            if (deployedTokens[i].creator == creator) {
                count++;
            }
        }
        
        // Then create and fill the result array
        TokenInfo[] memory result = new TokenInfo[](count);
        uint256 resultIndex = 0;
        
        for (uint256 i = 0; i < deployedTokens.length; i++) {
            if (deployedTokens[i].creator == creator) {
                result[resultIndex] = deployedTokens[i];
                resultIndex++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Admin function to change the required burn amount
     * @param newBurnAmount New amount of FAITH tokens to burn (in wei)
     */
    function setRequiredBurnAmount(uint256 newBurnAmount) external onlyOwner {
        uint256 oldAmount = requiredBurnAmount;
        requiredBurnAmount = newBurnAmount;
        emit BurnAmountChanged(oldAmount, newBurnAmount);
    }
    
    /**
     * @dev Returns all deployed tokens
     */
    function getAllTokens() external view returns (TokenInfo[] memory) {
        return deployedTokens;
    }
} 