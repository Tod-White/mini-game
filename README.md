# mine.fun - Gold Token Mining Game

A simple blockchain game where users can mine Gold tokens on the Somnia network. Each mining action rewards the user with 1M GOLD tokens, with a total supply of 420M tokens.

## Technical Development Plan

### Phase 1: Smart Contract Development
- [x] Create GoldToken.sol contract with mining functionality
- [x] Set up Hardhat development environment
- [x] Implement deployment scripts
- [x] Create test-mining script
- [ ] Deploy contract to Somnia testnet
- [ ] Verify contract on Somnia explorer

### Phase 2: Frontend Foundation
- [ ] Set up React project structure
- [ ] Create voxel Gold token visual component
- [ ] Implement "MINE GOLD" button with states (ready/mining/mined-out)
- [ ] Design wallet connection component
- [ ] Implement responsive layout

### Phase 3: Blockchain Integration
- [ ] Connect to Somnia network (Chain ID: 50312)
- [ ] Implement wallet connection (MetaMask/WalletConnect)
- [ ] Set up contract interface with ethers.js
- [ ] Implement mining transaction process
- [ ] Handle transaction status and confirmations

### Phase 4: Mining Stats & Progress
- [ ] Create global progress bar (420M total supply)
- [ ] Design personal mining stats component
- [ ] Implement real-time updates via events
- [ ] Add animation for successful mining
- [ ] Handle "mined out" state when all tokens are claimed

### Phase 5: Deployment & Launch
- [ ] Host frontend on static hosting (GitHub Pages)
- [ ] Add final styling and polish
- [ ] Test on multiple devices and browsers
- [ ] Launch and promote

## Project Structure

- `/contracts` - Smart contract files 
- `/public` - Static assets for the frontend
- `/src` - React application source code
- `/scripts` - Deployment and utility scripts
- `/test` - Smart contract tests

## Smart Contract Overview

The `GoldToken` contract is an ERC-20 token with the following key features:
- Total supply: 420,000,000 tokens
- Mining reward: 1,000,000 tokens per mine action
- Tracks mining statistics per user wallet
- Monitors total mined supply and remaining tokens

## Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
# Create a .env file with your private key and other settings
# You can use .env.example as a template
```

3. **Deploy to Somnia testnet**:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network somnia-testnet
```

4. **Verify the contract**:
```bash
npx hardhat verify --network somnia-testnet YOUR_CONTRACT_ADDRESS
```

5. **Test mining functionality**:
```bash
# After updating CONTRACT_ADDRESS in your .env file
npx hardhat run scripts/test-mine.js --network somnia-testnet
```

## Frontend Development (Planned)

The UI will feature:
1. A voxel-style "GOLD" token as the centerpiece
2. A prominent "MINE GOLD" button that changes state during mining
3. A progress bar showing global mining status (tokens mined/remaining)
4. Personal mining stats for the connected user
5. Wallet connection and network status indicators

## User Experience Flow

1. **Arrival & Connection**
   - User connects wallet to Somnia network
   - UI shows global mining progress

2. **Mining Process**
   - User clicks "MINE GOLD" button
   - Wallet prompts to sign transaction
   - On confirmation, user receives 1M GOLD tokens
   - Visual feedback shows success

3. **Stats & Progress**
   - User sees their total mined tokens
   - Global progress updates in real-time
   - As supply decreases, token visuals change

4. **Completion**
   - When all 420M tokens are mined, button shows "MINED OUT"
   - Token visual shows depleted state

## License

MIT
