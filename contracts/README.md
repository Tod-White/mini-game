# Prayer Token Smart Contracts

This folder contains the smart contracts for the Prayer Token Deployment System.

## Contracts

### PrayerToken.sol

A minable ERC20 token, similar to the FAITH token, but with configurable name, symbol, and total supply. Each deployed token:

- Has its own name, symbol, and total supply
- Tracks the address of its creator
- Allows any user to mine tokens via the `mine()` function
- Awards 1,000 tokens per prayer (mining) action
- Tracks prayer statistics for each user
- Emits events for mining actions

### PrayerTokenFactory.sol

A factory contract that deploys new PrayerToken instances while burning FAITH tokens:

- Requires 5,000 FAITH tokens to deploy a new token (configurable by admin)
- Burns FAITH tokens by sending them to the zero address
- Maintains a registry of all deployed tokens
- Provides functions to query token information
- Allows admin to adjust the required burn amount
- Emits events for token deployment and configuration changes

## Usage

### Deploying the Factory

```bash
# Set the FAITH token address
export FAITH_TOKEN_ADDRESS=0x3E9c46064B5f8Ab4605506841076059F3e93fbb0

# Deploy the factory
npx hardhat run scripts/deploy-prayer-token-factory.js --network somnia-testnet
```

### Deploying a Test Token

```bash
# Set the factory and FAITH token addresses
export FACTORY_ADDRESS=<deployed_factory_address>
export FAITH_TOKEN_ADDRESS=0x3E9c46064B5f8Ab4605506841076059F3e93fbb0

# Deploy a test token
npx hardhat run scripts/deploy-test-token.js --network somnia-testnet
```

### Running Tests

```bash
npx hardhat test
```

## Development

### Prerequisites

- Node.js v16+
- Hardhat
- OpenZeppelin Contracts

### Key Features

- Each prayer token works just like the original FAITH token
- The factory maintains a registry of all deployed tokens
- Tokens are deployed by burning 5,000 FAITH tokens
- The burn amount can be adjusted by the factory admin
- All tokens can be mined by anyone 