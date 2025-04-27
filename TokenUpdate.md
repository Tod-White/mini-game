# FaithToken Contract Update Summary

## Context
The project originally launched with KarmaToken (KARMA), featuring a total supply of 77,770,000 and 10,000 tokens per mine/prayer action. To better align with new tokenomics and branding, the contract was redeployed as FaithToken (FAITH) with a new total supply of 777,777,000 and 1,000 tokens per mine/prayer action. This update required changes to the contract, frontend, explorer links, and user-facing messages to ensure consistency and correct integration.

## Which Files Affect the User Interface?

| File                               | Directly Affects UI? | What Users See/Interact With                |
|------------------------------------|:--------------------:|---------------------------------------------|
| src/utils/blockchain.js            |         No*          | (Provides data to UI, not visible itself)   |
| src/App.js                         |        Yes           | Main layout, stats, prompts, progress bar   |
| src/components/PrayButton.js       |        Yes           | Pray button, “prayed out” message           |
| src/components/AllocationStats.js  |        Yes           | Token info card, explorer link              |

> *Note: If the logic/data in `blockchain.js` is wrong, the UI will show incorrect info, but the file itself does not render UI.

## Changes from KarmaToken to FaithToken
- **Contract name and symbol:** Changed from `KarmaToken` (`KARMA`) to `FaithToken` (`FAITH`).
- **Tokens per mine:** Changed from 10,000 to 1,000 tokens per mine/prayer action.
- **Total supply:** Changed from 77,770,000 to 777,777,000.
- **User-facing messages:** Updated all references from "karma" to "faith" in revert messages and comments.
- **Deployment:** Deployed as a new contract with the above parameters.

## Files Changed
- `src/utils/blockchain.js` — Updated contract address, hardcoded supply values, and fallback logic.
- `src/App.js` — Updated default global stats for total and remaining supply.
- `src/components/PrayButton.js` — Updated user-facing message for total supply.
- `src/components/AllocationStats.js` — Updated Shannon Explorer link to new contract address.

## Changes Made

### 1. Contract Address Update
- Updated all references to the FaithToken contract address in the frontend code to:
  - `0x3E9c46064B5f8Ab4605506841076059F3e93fbb0`
- Updated the Shannon Explorer link in the Token Information section to use the new contract address.

### 2. Total Supply and Remaining Supply
- Updated all hardcoded values and default states for `totalSupply` and `remainingSupply` to `777,777,000` in:
  - `src/utils/blockchain.js`
  - `src/App.js`
  - Any fallback/default logic for global stats.
- Updated user-facing messages to reflect the new supply (e.g., "All 777,777,000 Faith tokens have been claimed. Praying is now closed.").

### 3. User Interface
- Ensured that all supply-related displays, stats, and prompts now show the correct new total supply.
- Verified that the airdrop prompt, progress bar, and stats cards are consistent with the new tokenomics.

## Notes for Future Changes
- Always update both the contract address and any hardcoded supply values in the frontend when redeploying or changing tokenomics.
- Update explorer links and any documentation or user-facing messages referencing the contract or supply.
- Test the dApp after changes to ensure all stats and interactions reflect the new contract.

---
_Last updated after redeploying FaithToken with 777,777,000 supply on Somnia._
