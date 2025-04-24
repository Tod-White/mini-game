# pray.fun - Faith Token Prayer Game

A blockchain game where users can pray for Faith tokens on the Somnia network. This project began as the Karma Token game and has now been updated to Faith Token with improved architecture.

## Faith Token Update (April 2025)

The project has been updated with a new Faith Token implementation that makes significant improvements to the user experience and technical architecture:

### Key Changes

- **New Token**: Faith Token replaces Karma Token, with a total supply of 666,666,666 tokens
- **Improved UX**: Users only need to sign once to authorize the application, then can pray multiple times without transaction signing
- **Efficient Distribution**: Each prayer grants 1 Faith token, delivered through efficient batch processing
- **Enhanced Animation**: "Faith+1" animation appears once per prayer, providing immediate feedback
- **Blockchain Efficiency**: Batched transactions reduce gas costs and blockchain congestion
- **Etherbase Integration**: Uses Etherbase for real-time state management between prayers and confirmations

### New Architecture Components

#### Smart Contracts
- **FaithToken.sol**: New ERC-20 token with batch processing support
- **BatchProcessor.sol**: Manages batched prayer processing

#### Backend Services
- **Etherbase Integration**: Tracks prayer state between blockchain confirmations
- **Batch Processing Service**: Runs on a schedule to process prayers in efficient batches

#### Frontend Enhancements
- **Pending Prayer Display**: Shows both pending and confirmed tokens
- **Streamlined Prayer Flow**: Each click produces one animation and records one prayer

### New Development Plan

#### Phase 6: Faith Token Implementation (Completed)
- [x] Create FaithToken smart contract with batch processing support
- [x] Implement BatchProcessor contract
- [x] Integrate Etherbase for state management
- [x] Update frontend for Faith token visualization
- [x] Modify prayer animation to show one "Faith+1" per click

#### Phase 7: Batch Processing System (Completed)
- [x] Create batch processing service
- [x] Implement scheduled batch execution
- [x] Add state synchronization between Etherbase and blockchain
- [x] Display pending and confirmed token counts

#### Phase 8: Deployment & Launch (Next)
- [ ] Deploy Etherbase Source contract
- [ ] Deploy Faith Token and Batch Processor contracts
- [ ] Set up batch processing service on server
- [ ] Host updated frontend on static hosting
- [ ] Launch and promote

## Original Karma Token Implementation

A blockchain game where users can pray for Karma tokens on the Somnia network. Each prayer action rewards the user with 10K KARMA tokens, with a total supply of 77.77M tokens.

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

### Phase 5: Deployment & Launch (Completed)
- [x] Host frontend on static hosting
- [x] Add final styling and polish
- [x] Test on multiple devices and browsers
- [x] Launch and promote

## Technical Architecture Summary

### Updated Project Structure

pray.fun/
├── contracts/                # Smart contract source files
│   ├── KarmaToken.sol        # Original ERC-20 token contract with prayer functionality
│   ├── FaithToken.sol        # New ERC-20 token with batch processing support
│   └── BatchProcessor.sol    # Contract for processing prayers in batches
├── scripts/                  # Deployment and testing scripts
│   ├── deploy-karma.js       # Original Hardhat deployment script
│   ├── deploy-contracts.js   # New deployment script for Faith Token system
│   ├── batch-processor.js    # Script to process batched prayers
│   ├── batch-service.js      # Service to run batch processing on a schedule
│   └── test-prayer-karma.js  # Script to test prayer functionality
├── test/                     # Contract test files
│   ├── KarmaToken.test.js    # Unit tests for the KarmaToken contract
│   └── FaithToken.test.js    # Unit tests for the FaithToken contract
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
│   │   ├── blockchain.js     # Blockchain integration for frontend
│   │   └── etherbaseClient.js # Integration with Etherbase for state management
│   ├── App.js                # Main React application component
│   ├── App.css               # Application-wide styling
│   ├── index.js              # React entry point
│   └── index.css             # Global CSS variables and styling
├── hardhat.config.js         # Hardhat configuration 
├── package.json              # Project dependencies and scripts
├── .env.example              # Example environment variables
└── .env                      # Environment variables (not in repo)
```

### Smart Contract Architecture

#### Original: KarmaToken.sol

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

#### New: FaithToken.sol and BatchProcessor.sol

The FaithToken system consists of two contracts that work together:

```solidity
contract FaithToken is ERC20, Ownable {
    // Each prayer action gives 1 token
    uint256 public constant TOKENS_PER_PRAYER = 1 * 10**18;
    uint256 public constant MAX_SUPPLY = 666_666_666 * 10**18;
    uint256 public totalMined = 0;
    
    // Track individual prayer stats
    mapping(address => uint256) public prayerStats;
    
    // Batch processor address
    address public batchProcessor;
    
    // Process a batch of prayers
    function processBatch(address[] calldata users, uint256[] calldata amounts) external {
        require(msg.sender == batchProcessor, "Only batch processor can process prayers");
        // Process multiple prayers in a single transaction
        // ...
    }
}

contract BatchProcessor is Ownable {
    // Faith token contract
    FaithToken public faithToken;
    
    // Process batches of prayers
    function processBatch(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        // Validate the batch
        // Submit the batch to the Faith token contract
    }
}
```

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

#### Etherbase Integration

The new Faith Token implementation uses Etherbase for state management:

```javascript
// EtherbaseProvider wraps the application
<EtherbaseProvider config={etherbaseConfig}>
  <App />
</EtherbaseProvider>

// Record a prayer in Etherbase
export const prayForFaith = async () => {
  // Record the prayer in Etherbase state
  await recordPrayer(userAddress);
  
  // This doesn't require a blockchain transaction
  return { success: true };
};

// Display both pending and confirmed tokens
<PrayerStats 
  confirmed={prayerStats.confirmedPrayers}
  pending={prayerStats.pendingPrayers}
  total={prayerStats.totalPrayers}
  balance={prayerStats.balance}
/>
```

#### Batch Processing

The batch processing system runs on a schedule:

```javascript
// Schedule regular batch processing
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled batch processing');
  await processBatches();
});

// Process batches of prayers
async function processBatches() {
  // Get all pending prayers from Etherbase
  const pendingPrayers = await getPendingPrayers();
  
  // Group into batches of up to 100 prayers
  const batches = createBatches(pendingPrayers, 100);
  
  // Process each batch
  for (const batch of batches) {
    await batchProcessor.processBatch(batch.users, batch.amounts);
    await updateEtherbaseState(batch);
  }
}
```

### Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
# Create a .env file with your settings
FAITH_TOKEN_ADDRESS=your_faith_token_address
BATCH_PROCESSOR_ADDRESS=your_batch_processor_address
ETHERBASE_SOURCE_ADDRESS=your_etherbase_source_address
PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://dream-rpc.somnia.network
```

3. **Start development server**:
```bash
npm start
```

4. **Deploy contracts**:
```bash
npm run deploy-contracts
```

5. **Start batch processor service**:
```bash
node scripts/batch-service.js
```

## License

MIT