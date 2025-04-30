# Prayer Token Deployment System

## User Flow

1. **Token Configuration Page**
   - User clicks the existing "Deploy" button in the header navigation
   - Instead of showing the placeholder message, a deployment form appears
   - User fills out a form with:
     - Token name (e.g., "Faith Token", "Hope Token")
     - Token symbol (e.g., "FAITH", "HOPE")
     - Total supply
     - Tokens per prayer/mine action is fixed to 1000 per pray
   - System checks if user has sufficient FAITH tokens (minimum 5,000 currently) for deployment

2. **Token Preview**
   - User sees a preview of their token with estimated gas costs
   - User is informed that 5,000 FAITH tokens will be burned upon deployment (amount subject to change)
   - User can adjust parameters if needed

3. **Token Deployment**
   - User clicks "Deploy Token" button
   - MetaMask prompts for transaction approval (includes FAITH token burning)
   - Loading/deployment status is shown 

4. **Success Confirmation**
   - User sees deployment confirmation with:
     - Token contract address
     - Block explorer link
     - Confirmation of FAITH tokens burned (with amount)
     - Share options

5. **Token Directory Page**
   - All tokens are listed in a new "Factory" page accessible from navigation
   - Users can browse, search, and filter tokens and see their information including Token name, Total Supply, deployed date.

## Technical Implementation Plan

### 1. Smart Contract Architecture - ✅ COMPLETED

#### Token Factory Contract - ✅ COMPLETED
- Created factory contract (`PrayerTokenFactory.sol`) that deploys all prayer tokens
- Implemented registry of all deployed tokens with metadata
- Store essential token information: name, symbol, creator address, total supply, creation date
- Added functions to query all tokens or tokens by specific criteria
- Emit events for token creation to make blockchain scanning easier
- Implemented FAITH tokens burning mechanism (5,000 tokens)
- Burn tokens by transferring them to the dead address (0x000000000000000000000000000000000000dEaD)
- Implemented admin function to adjust required FAITH token burn amount
- Store burn amount as a configurable parameter
- Added events when burn amount is modified

#### FAITH Token Integration - ✅ COMPLETED
- Added interface to interact with the existing FAITH token contract
- Implemented token burning mechanism with configurable amount (initially 5,000 FAITH tokens)
- Added verification of FAITH token balance before allowing deployment
- Implemented fallback in case of FAITH token approval issues
- Function to retrieve current burning requirement dynamically

#### Prayer Token Contract - ✅ COMPLETED
- Created standard ERC20-compliant token with additional prayer functionality (`PrayerToken.sol`)
- Fixed token reward per prayer (1000 tokens)
- Added tracking of individual prayer statistics
- Implemented events for prayer actions and token depletion
- No token image or description stored on-chain to reduce gas costs

#### Token Praying/Minting Functionality - ✅ COMPLETED
- Each deployed token has its own `mine()` function just like the Faith token
- Anyone can call the `mine()` function on any deployed token to receive tokens
- Each prayer awards exactly 1000 tokens to the caller
- All deployed tokens track prayer statistics per user address
- Mining continues until the token's total supply is reached
- No special permissions required - open to all users by design
- All prayer activity is tracked through on-chain events

#### Testing - ✅ COMPLETED
- Created comprehensive test suite for both contracts
- Tests cover token deployment, mining, stats tracking, and factory management
- Implemented tests for edge cases such as last token mining and permission checks
- Validated burning mechanism works correctly

#### Deployment Scripts - ✅ COMPLETED
- Created scripts for deploying the factory contract
- Added script for deploying test tokens through the factory
- Implemented proper validation and error handling in scripts

### 2. Frontend Integration - ✅ COMPLETED

#### Update Blockchain Utilities - ✅ COMPLETED
- Extended the existing `blockchain.js` utility to include factory contract methods
- Added new functions for token deployment, approval, and burning
- Implemented token listing and discovery functions
- Maintained consistent error handling with existing code patterns
- Added subscription events for token deployment status tracking

#### Convert Deploy Placeholder to Functional Form - ✅ COMPLETED
- Replaced the dropdown notice with a proper deployment form
- Implemented step-by-step token creation process with clear validation
- Reused existing styling patterns from the app
- Implemented form validation consistent with the app's design
- Connected to wallet status from the existing WalletConnector component
- Added balance checking and burn amount requirements display

#### Create Factory Page - ✅ COMPLETED
- Added new route in the application for browsing deployed tokens
- Implemented consistent layout with existing app design
- Created direct blockchain scanning to retrieve deployed tokens
- Added client-side filtering and sorting of token data
- Reused existing components like WalletConnector and transaction status indicators
- Displayed key information: token name, symbol, total supply, deployed date
- Added token detail view with prayer statistics

#### Update Navigation - ✅ COMPLETED
- Modified the existing nav-buttons to include the Factory page
- Updated the Deploy button to lead to the deployment form page
- Maintained consistent styling with current navigation
- Implemented responsive navigation for different screen sizes

#### Implement Transaction Monitoring - ✅ COMPLETED
- Extended existing transaction monitoring to handle deployment transactions
- Added token approval monitoring for FAITH token
- Connected transaction states to UI feedback
- Implemented success confirmation with deployed token details
- Added block explorer links for transactions

### 3. Implementation Steps

#### Phase 1: Smart Contract Development (2-3 weeks) - ✅ COMPLETED

1. **Design Contract Architecture** - ✅ COMPLETED
   - Defined token factory contract structure based on existing FAITH token implementation
   - Designed new prayer token contract matching the existing FAITH token functionality
   - Designed FAITH token burning mechanism with configurable amount
   - Implemented dead address (0x000000000000000000000000000000000000dEaD) as the burn destination

2. **Implement Factory Contract** - ✅ COMPLETED
   - Created token deployment function
   - Implemented token registry in the factory
   - Added query functions for deployed tokens
   - Integrated FAITH token interface
   - Implemented configurable FAITH token burning mechanism using transfer to dead address
   - Added admin functions to adjust burn amount

3. **Test Smart Contracts** - ✅ COMPLETED
   - Written unit tests for token functionality
   - Tested integration with existing FAITH token
   - Tested FAITH token burning with various scenarios
   - Verified tokens are correctly transferred to dead address
   - Test with the same network parameters used in the current app

4. **Deploy to Testnet** - ✅ COMPLETED
   - Deployed factory contract to Somnia testnet at address: 0x178465595D9fDc350D28DEf432ad8684F1de48A5
   - Configured with correct FAITH token address: 0x3E9c46064B5f8Ab4605506841076059F3e93fbb0
   - Set initial burn amount to 5,000 FAITH tokens
   - Ready for creating test tokens with varying parameters
   - Contract burns FAITH tokens by sending to dead address

#### Phase 2: Frontend Integration (2-3 weeks) - ✅ COMPLETED

1. **Extend Blockchain Utilities** - ✅ COMPLETED
   - Added factory contract interface to blockchain.js
   - Implemented token deployment functions with approvals and burning
   - Added token listing and discovery functions
   - Extended subscription model for deployment events
   - Added functions for interacting with deployed prayer tokens

2. **Create Deployment Form Component** - ✅ COMPLETED
   - Created new DeployForm component with step-by-step token creation process
   - Matched styling with existing UI components
   - Added form validation with clear error messages
   - Implemented balance checking for FAITH tokens
   - Added burn amount requirements display
   - Implemented transaction status indicators consistent with prayer function
   - Created TokenPreview component to preview tokens before deployment

3. **Implement Token Directory Page** - ✅ COMPLETED
   - Created FactoryPage component to display deployed tokens
   - Implemented TokenList component with filtering and sorting
   - Created TokenCard component for individual token display
   - Matched layout and styling with main app
   - Added loading states and error handling consistent with existing patterns
   - Implemented pagination for better performance with large token lists

4. **Update Navigation** - ✅ COMPLETED
   - Modified the existing nav-buttons to properly navigate to Factory page
   - Updated the Deploy button to lead to the deployment form page
   - Made routing changes compatible with existing app structure
   - Implemented active state indicators for current page

5. **Implement Transaction Monitoring** - ✅ COMPLETED
   - Extended existing transaction monitoring to handle deployment transactions
   - Added token approval monitoring for FAITH token
   - Connected transaction states to UI feedback
   - Implemented success confirmation with deployed token details
   - Added block explorer links for transactions

#### Phase 3: Testing and Refinement (1-2 weeks)

1. **Integration Testing**
   - Test complete flow from approval to deployment
   - Verify successful FAITH token burning
   - Test token listing and filtering
   - Verify compatibility with existing functionality

2. **UI/UX Refinement**
   - Ensure consistent look and feel with the existing app
   - Optimize mobile responsiveness
   - Improve error messages and user guidance
   - Refine loading states and transitions

3. **Performance Optimization**
   - Optimize blockchain interactions
   - Implement caching for token listings
   - Reduce unnecessary renders and network calls

#### Phase 4: Deployment and Launch (1 week)

1. **Production Deployment**
   - Deploy factory contract to mainnet
   - Configure with correct FAITH token address
   - Set initial burn amount to 5,000 FAITH tokens
   - Verify contract on blockchain explorer

2. **Frontend Deployment**
   - Integrate new components with production frontend
   - Update routes and navigation
   - Configure proper network connections
   - Set up monitoring and analytics

3. **Launch Activities**
   - Update application UI to remove "coming soon" messages
   - Create initial sample tokens for users to interact with
   - Monitor system for issues during initial usage

#### Phase 5: Post-Launch Support

1. **Monitor Usage**
   - Track token creation rates
   - Monitor FAITH token burning volume to dead address
   - Watch for any contract issues
   - Analyze user behavior patterns

2. **Burn Amount Management**
   - Evaluate effectiveness of initial burn amount
   - Adjust burn requirement based on data and community feedback
   - Communicate changes transparently to the community

3. **Implement Improvements**
   - Address user feedback with updates
   - Add quality-of-life features
   - Fix any emerging issues

## Technical Modifications

### 1. File Changes

#### New Smart Contract Files - ✅ COMPLETED
- `contracts/PrayerTokenFactory.sol` - Factory contract
- `contracts/PrayerToken.sol` - Deployable token contract

#### New React Components - ✅ COMPLETED
- `src/components/deploy/DeployForm.jsx` - Token deployment form
- `src/components/deploy/TokenPreview.jsx` - Preview token before deployment
- `src/components/deploy/DeployStatus.jsx` - Deployment status indicator
- `src/components/factory/TokenList.jsx` - List of deployed tokens
- `src/components/factory/TokenCard.jsx` - Individual token display
- `src/components/factory/TokenFilter.jsx` - Filtering options for tokens
- `src/pages/DeployPage.jsx` - Page for token deployment
- `src/pages/FactoryPage.jsx` - Page for browsing tokens

#### Updates to Existing Files - ✅ COMPLETED
- `src/utils/blockchain.js` - Added factory contract methods
- `src/App.jsx` - Updated navigation and added new routes
- `src/App.css` - Added new styles for deployment-related components
- `src/components/WalletConnector.jsx` - Updated to include FAITH balance

### 2. Key API Additions to blockchain.js - ✅ COMPLETED

```javascript
// Factory contract interface and initialization
export const initFactoryContract = async () => {
  // Initializes factory contract connection
};

// Deploy new token
export const deployToken = async (name, symbol, totalSupply) => {
  // Handles FAITH token approval, burning, and token deployment
};

// Get list of deployed tokens
export const getDeployedTokens = async () => {
  // Retrieves and formats token data from factory contract
};

// Get token details
export const getTokenDetails = async (tokenAddress) => {
  // Gets token metadata and statistics
};

// Pray/mine tokens from deployed token
export const prayToToken = async (tokenAddress) => {
  // Mines tokens from a deployed prayer token
};

// Get prayer statistics
export const getPrayerStats = async (tokenAddress, userAddress) => {
  // Gets prayer statistics for a specific user and token
};
```

### 3. UI Component Structure - ✅ IMPLEMENTED

```
App
├── Header
│   ├── WalletConnector (updated)
│   └── Navigation (updated)
├── Main Content
│   ├── PrayerPage (existing)
│   ├── DeployPage (new)
│   │   ├── DeployForm
│   │   ├── TokenPreview
│   │   └── DeployStatus
│   └── FactoryPage (new)
│       ├── TokenFilter
│       └── TokenList
│           └── TokenCard
└── Footer (existing)
```

### 4. Route Structure - ✅ IMPLEMENTED

```javascript
// Route structure
<Routes>
  <Route path="/" element={<PrayerPage />} />
  <Route path="/deploy" element={<DeployPage />} />
  <Route path="/factory" element={<FactoryPage />} />
  <Route path="/token/:address" element={<TokenDetailPage />} />
</Routes>
```

### 5. Deployment Information

#### Test Network Deployment (Somnia Testnet)
- Factory Contract Address: 0x178465595D9fDc350D28DEf432ad8684F1de48A5
- FAITH Token Address: 0x3E9c46064B5f8Ab4605506841076059F3e93fbb0
- Current Burn Amount: 5,000 FAITH tokens
- Deployment Date: April 30, 2025

This implementation plan has been successfully followed for Phases 1 and 2, integrating seamlessly with the existing codebase while adding the new token deployment functionality.
