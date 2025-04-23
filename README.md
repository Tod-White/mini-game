# pray.fun - Karma Token Prayer Game

A blockchain game where users can pray for Karma tokens on the Somnia network. Each prayer action rewards the user with 10K KARMA tokens, with a total supply of 77.77M tokens.

## Comprehensive Development Plan

### Phase 1: Smart Contract Development (Completed)
- [x] Create KarmaToken.sol contract with praying functionality
- [x] Set up Hardhat development environment
- [x] Implement deployment scripts
- [x] Create test-prayer script
- [x] Deploy contract to Somnia testnet
- [x] Verify contract on Somnia explorer

### Phase 2: Frontend Foundation (Completed)
- [x] Set up React project structure
- [x] Create prayer hands visual component
- [x] Implement "PRAY" button with states (ready/praying/prayed-out)
- [x] Design wallet connection component
- [x] Implement responsive layout

### Phase 3: Blockchain Integration (Completed)
- [x] Connect to Somnia network (Chain ID: 50312)
- [x] Implement wallet connection (MetaMask/WalletConnect)
- [x] Set up contract interface with ethers.js
- [x] Implement prayer transaction process
- [x] Handle transaction status and confirmations

### Phase 4: Prayer Stats & Progress (Completed)
- [x] Create global progress bar (77.77M total supply)
- [x] Design personal prayer stats component
- [x] Add animation for successful praying
- [x] Implement real-time updates via events
- [x] Handle "prayed out" state when all tokens are claimed

### Phase 5: Deployment & Launch (Next)
- [ ] Host frontend on static hosting
- [ ] Add final styling and polish
- [ ] Test on multiple devices and browsers
- [ ] Launch and promote

## Technical Architecture Summary

### Project Structure

pray.fun/
├── contracts/                # Smart contract source files
│   └── KarmaToken.sol        # Main ERC-20 token contract with prayer functionality
├── scripts/                  # Deployment and testing scripts
│   ├── deploy-karma.js       # Hardhat deployment script
│   ├── test-prayer-karma.js  # Script to test prayer functionality
│   └── deploy-karma-direct.js # Direct deployment without Hardhat
├── test/                     # Contract test files
│   └── KarmaToken.test.js    # Unit tests for the KarmaToken contract
├── public/                   # Static assets
│   └── image/                # Image resources including Prey.png
├── src/                      # React frontend source code
│   ├── components/           # UI components
│   │   ├── PrayerHands.js    # Main prayer interaction component
│   │   ├── PrayerHands.css   # Styling for prayer component
│   │   ├── WalletConnector.js # Wallet connection component
│   │   ├── ProgressBar.js    # Progress bar showing global prayer stats
│   │   ├── PrayerStats.js    # Component showing user prayer statistics
│   │   └── BackgroundParticles.js # Visual background effects
│   ├── utils/                # Utility functions
│   │   └── blockchain.js     # Blockchain integration for frontend
│   ├── App.js                # Main React application component
│   ├── App.css               # Application-wide styling
│   ├── index.js              # React entry point
│   └── index.css             # Global CSS variables and styling
├── hardhat.config.js         # Hardhat configuration 
├── package.json              # Project dependencies and scripts
└── .env                      # Environment variables (not in repo)
```

### Smart Contract Architecture

#### KarmaToken.sol

The KarmaToken contract is built on OpenZeppelin's ERC-20 implementation with the following key features:

```solidity
contract KarmaToken is ERC20 {
    // Each prayer action gives 10K tokens
    uint256 public constant TOKENS_PER_MINE = 10_000 * 10**18;
    uint256 public constant MAX_SUPPLY = 77_770_000 * 10**18;
    uint256 public totalMined = 0;
    
    // Track individual prayer stats
    mapping(address => uint256) public minerStats;
    
    // Main prayer function
    function mine() external {
        require(totalMined < MAX_SUPPLY, "All karma has been mined");
        _transfer(address(this), msg.sender, TOKENS_PER_MINE);
        totalMined += TOKENS_PER_MINE;
        minerStats[msg.sender] += TOKENS_PER_MINE;
    }
    
    // Stats access functions
    function getMinerStats(address miner) external view returns (uint256) {...}
    function getRemainingSupply() external view returns (uint256) {...}
}
```

- **Token Specifications**:
  - Name: Karma
  - Symbol: KARMA
  - Decimals: 18
  - Total Supply: 77,770,000 KARMA
  - Prayer Reward: 10,000 KARMA per action

- **Contract Events**:
  - `Mining(address indexed miner, uint256 amount, uint256 timestamp)` // Prayer event
  - `MiningExhausted(uint256 totalMined, uint256 timestamp)` // Prayer exhausted event
  - Standard ERC-20 `Transfer` events

- **Deployment Information**:
  - Network: Somnia Network
  - Chain ID: 50312
  - Contract Address: 0xD3D811fE6eDb5f477C1eD985DC8D9633853C675e
  - Explorer URL: https://shannon-explorer.somnia.network/address/0xD3D811fE6eDb5f477C1eD985DC8D9633853C675e

### Frontend Implementation

#### React Architecture

The frontend is built using React with a component-based architecture:

- **App.js**: Main application component that orchestrates all other components and manages global state
- **PrayerHands.js**: Core interaction component for the prayer mechanism
- **WalletConnector.js**: Handles wallet connection and network management
- **ProgressBar.js**: Visual representation of prayer progress
- **PrayerStats.js**: Displays user prayer statistics
- **PrayingAnimation.js**: Animation for successful prayer confirmation
- **BackgroundParticles.js**: Visual background particles for aesthetics

#### Styling System

The project uses a custom CSS approach with:

- **Global CSS Variables**: Defined in `index.css` for consistent theming
  ```css
  :root {
    --primary-color: #B19CD9;
    --background-color-start: #5C2A9D;
    --background-color-end: #7A4EB6;
    --card-bg: rgba(138, 112, 190, 0.7);
    --accent-color: #FFB6C1;
    /* Additional design tokens... */
  }
  ```

- **Component-specific CSS**: Each component has its own CSS file (e.g., PrayerHands.css)
- **Responsive Design**: Media queries for different screen sizes
- **Animation Systems**: Custom keyframe animations for interactions
- **Font Integration**: Google Fonts for specialized typography
  - Baloo 2 for headings
  - Varela Round for main text
  - Bubblegum Sans for numbers
  - Concert One for special elements

#### Blockchain Integration

The blockchain integration is handled through `utils/blockchain.js` which provides:

- **Wallet Connection**: Using ethers.js for MetaMask integration
- **Contract Interaction**: ABI interface with KarmaToken contract
- **Transaction Management**: Monitoring transaction states
- **Event Subscription**: Real-time updates from contract events
- **Network Management**: Chain detection and switching

```javascript
// Key integration functions
export const initBlockchain = async () => {...}  // Initialize connection
export const prayForKarma = async () => {...}    // Main praying function
export const getBalance = async (address) => {...} // Get KARMA balance
export const getGlobalStats = async () => {...}  // Get global stats
```

1. Contract ABI is defined in `blockchain.js`:
```javascript
const KarmaTokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function mine() external", // Prayer function
  // Additional methods...
];
```

2. Contract instance is created using ethers.js:
```javascript
karmaTokenContract = new ethers.Contract(CONTRACT_ADDRESS, KarmaTokenABI, signer);
```

3. Contract events are subscribed to for real-time updates:
```javascript
karmaTokenContract.on("Mining", (miner, amount, timestamp) => {...}); // Prayer event
karmaTokenContract.on("MiningExhausted", (totalMined, timestamp) => {...}); // Prayer exhausted event
```

4. Prayer transaction flow:
   - UI triggers `prayForKarma()` function
   - Transaction is sent to the blockchain
   - UI shows pending state
   - Event listeners update UI on confirmation
   - Stats are refreshed automatically

#### Development Workflow

1. **Local Development**:
   ```bash
   npm start              # Start local React development server
   npx hardhat compile    # Compile smart contracts
   npx hardhat test       # Run contract tests
   ```

2. **Contract Deployment**:
   ```bash
   node deploy-karma-direct.js  # Deploy contract directly
   # OR
   npx hardhat run scripts/deploy-karma.js --network somnia-testnet
   ```

3. **Frontend Deployment**:
   ```bash
   npm run build  # Build production-ready frontend
   # Deploy build directory to static hosting
   ```

### Future Extensibility

The project is designed for easy extensibility:

1. **Multiple Prayer Tokens**: The architecture could support multiple token types
2. **Enhanced Animations**: The animation system is ready for more complex visuals
3. **Additional Stats**: The contract tracks data that could be visualized in more detail
4. **Social Features**: Integration with social sharing could be added

## Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
# Create a .env file with your private key and other settings
PRIVATE_KEY=您的钱包私钥
RPC_URL=https://dream-rpc.somnia.network
CONTRACT_ADDRESS=0xD3D811fE6eDb5f477C1eD985DC8D9633853C675e
EXPLORER_API_KEY=可能的API密钥
```

3. **Start development server**:
```bash
npm start
```

## License

MIT