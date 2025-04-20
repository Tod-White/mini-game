# mine.fun - Gold Token Mining Game

A simple blockchain game where users can mine Gold tokens on the Somnia network. Each mining action rewards the user with 1M GOLD tokens, with a total supply of 420M tokens.

## Project Structure

- `/contracts` - Smart contract files 
- `/public` - Static assets for the frontend
- `/src` - React application source code
- `/scripts` - Deployment and utility scripts
- `/test` - Smart contract tests

## Smart Contract

The GoldToken contract is an ERC-20 token with the following features:
- Total supply of 420M tokens
- Mining function that transfers 1M tokens per call
- Tracking of mining statistics per user
- Monitoring of remaining supply

## Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your private key and other settings
```

3. **Test the contract**:
```bash
npx hardhat test
```

## Deployment

1. **Deploy to Somnia testnet**:
```bash
npx hardhat run scripts/deploy.js --network somnia-testnet
```

2. **Verify the contract**:
```bash
npx hardhat verify --network somnia-testnet YOUR_CONTRACT_ADDRESS
```

3. **Test mining functionality**:
```bash
# Make sure CONTRACT_ADDRESS is set in your .env file
npx hardhat run scripts/test-mine.js --network somnia-testnet
```

## Usage

Once deployed, users can:
1. Connect their wallet
2. Click the "MINE GOLD" button
3. Confirm the transaction
4. Receive 1M GOLD tokens

The game continues until all 420M tokens have been mined.

## License

MIT
