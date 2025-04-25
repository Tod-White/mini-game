// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// The token contract that will be deployed by the factory
contract MineableToken is ERC20, Ownable {
    uint256 public constant tokensPerPrayer = 1 * 10**18; // Fixed at 1 token per prayer
    uint256 public totalMined;
    mapping(address => uint256) public minerStats;

    event Mining(address indexed miner, uint256 amount, uint256 timestamp);
    event MiningExhausted(uint256 totalMined, uint256 timestamp);

    constructor(
        string memory name,
        string memory symbol,
        uint256 _totalSupply,
        address initialOwner
    ) ERC20(name, symbol) {
        _transferOwnership(initialOwner);
        _mint(initialOwner, _totalSupply);
    }

    function mine() external {
        require(balanceOf(owner()) >= tokensPerPrayer, "Mining exhausted");
        
        _transfer(owner(), msg.sender, tokensPerPrayer);
        minerStats[msg.sender] += tokensPerPrayer;
        totalMined += tokensPerPrayer;
        
        emit Mining(msg.sender, tokensPerPrayer, block.timestamp);
        
        if (balanceOf(owner()) < tokensPerPrayer) {
            emit MiningExhausted(totalMined, block.timestamp);
        }
    }

    function getMinerStats(address miner) external view returns (uint256) {
        return minerStats[miner];
    }

    function getRemainingSupply() external view returns (uint256) {
        return balanceOf(owner());
    }
}

// The factory contract that deploys new token contracts
contract TokenFactory is Ownable {
    address[] public deployedTokens;
    
    event TokenDeployed(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol
    );
    
    constructor() {
        _transferOwnership(msg.sender);
    }
    
    function deployToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) external returns (address) {
        MineableToken newToken = new MineableToken(
            name,
            symbol,
            totalSupply,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        deployedTokens.push(tokenAddress);
        
        emit TokenDeployed(
            tokenAddress,
            msg.sender,
            name,
            symbol
        );
        
        return tokenAddress;
    }
    
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
} 