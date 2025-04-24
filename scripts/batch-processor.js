/**
 * Batch Processor for Faith Token
 * 
 * This script processes prayer requests in batches from Etherbase state
 * and submits them to the Faith Token contract.
 */
const { ethers } = require('ethers');
const axios = require('axios');

// Contract ABIs
const FaithTokenABI = require('../artifacts/contracts/FaithToken.sol/FaithToken.json').abi;
const BatchProcessorABI = require('../artifacts/contracts/BatchProcessor.sol/BatchProcessor.json').abi;

// Configuration
const BATCH_SIZE = 100; // Max number of prayers to process in one batch
const MINIMUM_BATCH_SIZE = 10; // Minimum number of prayers to trigger batch processing
const ETHERBASE_SOURCE_ADDRESS = process.env.ETHERBASE_SOURCE_ADDRESS;
const FAITH_TOKEN_ADDRESS = process.env.FAITH_TOKEN_ADDRESS;
const BATCH_PROCESSOR_ADDRESS = process.env.BATCH_PROCESSOR_ADDRESS;
const RPC_URL = process.env.RPC_URL || 'https://dream-rpc.somnia.network';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERBASE_READER_URL = process.env.ETHERBASE_READER_URL || 'https://etherbase-reader-496683047294.europe-west2.run.app';
const ETHERBASE_WRITER_URL = process.env.ETHERBASE_WRITER_URL || 'https://etherbase-writer-496683047294.europe-west2.run.app';

// Initialize provider and signer
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract instances
const batchProcessor = new ethers.Contract(BATCH_PROCESSOR_ADDRESS, BatchProcessorABI, signer);
const faithToken = new ethers.Contract(FAITH_TOKEN_ADDRESS, FaithTokenABI, signer);

/**
 * Get all pending prayers from Etherbase state
 */
async function getPendingPrayers() {
  try {
    const response = await axios.get(`${ETHERBASE_READER_URL}/state?contractAddress=${ETHERBASE_SOURCE_ADDRESS}&path=users`);
    const users = response.data;
    
    const pendingPrayers = [];
    
    // Collect all users with pending prayers
    for (const [address, userData] of Object.entries(users)) {
      if (userData.pendingPrayers > 0) {
        pendingPrayers.push({
          address,
          count: userData.pendingPrayers
        });
      }
    }
    
    return pendingPrayers;
  } catch (error) {
    console.error('Error fetching pending prayers:', error);
    return [];
  }
}

/**
 * Process pending prayers in batches
 */
async function processBatches() {
  try {
    console.log('Starting batch processing...');
    
    // Get all pending prayers
    const pendingPrayers = await getPendingPrayers();
    console.log(`Found ${pendingPrayers.length} users with pending prayers`);
    
    // Calculate total number of pending prayers
    const totalPendingCount = pendingPrayers.reduce((sum, user) => sum + user.count, 0);
    console.log(`Total pending prayers: ${totalPendingCount}`);
    
    // If below minimum batch size, skip processing
    if (totalPendingCount < MINIMUM_BATCH_SIZE) {
      console.log(`Total pending prayers (${totalPendingCount}) below minimum batch size (${MINIMUM_BATCH_SIZE}). Skipping.`);
      return;
    }
    
    // Prepare batch processing
    const batches = [];
    let currentBatch = { users: [], amounts: [], totalPrayers: 0 };
    
    // Group users into batches
    for (const prayer of pendingPrayers) {
      // If adding this user would exceed batch size, finalize current batch
      if (currentBatch.totalPrayers + prayer.count > BATCH_SIZE) {
        batches.push({ ...currentBatch });
        currentBatch = { users: [], amounts: [], totalPrayers: 0 };
      }
      
      // Add user to current batch
      currentBatch.users.push(prayer.address);
      
      // Convert prayer count to Faith token amount (1 token per prayer)
      const amount = ethers.utils.parseUnits(prayer.count.toString(), 18);
      currentBatch.amounts.push(amount);
      currentBatch.totalPrayers += prayer.count;
    }
    
    // Add the last batch if it has any prayers
    if (currentBatch.totalPrayers > 0) {
      batches.push(currentBatch);
    }
    
    console.log(`Created ${batches.length} batches for processing`);
    
    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.users.length} users and ${batch.totalPrayers} prayers`);
      
      try {
        // Submit batch to the processor contract
        const tx = await batchProcessor.processBatch(batch.users, batch.amounts);
        console.log(`Batch transaction submitted: ${tx.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(`Batch transaction confirmed in block ${receipt.blockNumber}`);
        
        // Update Etherbase state for processed users
        await updateEtherbaseState(batch);
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error);
      }
    }
    
    console.log('Batch processing completed');
  } catch (error) {
    console.error('Error in batch processing:', error);
  }
}

/**
 * Update Etherbase state after batch processing
 */
async function updateEtherbaseState(batch) {
  try {
    console.log('Updating Etherbase state for processed prayers...');
    
    // For each user in the batch, update their pendingPrayers to 0
    for (let i = 0; i < batch.users.length; i++) {
      const user = batch.users[i];
      const prayerCount = parseInt(ethers.utils.formatUnits(batch.amounts[i], 18));
      
      // Get current user data
      const response = await axios.get(`${ETHERBASE_READER_URL}/state?contractAddress=${ETHERBASE_SOURCE_ADDRESS}&path=users.${user}`);
      const userData = response.data;
      
      // Update pending prayers and last claim time
      const updatedData = {
        ...userData,
        pendingPrayers: 0,
        lastClaimTime: Date.now()
      };
      
      // Send update to Etherbase
      await axios.post(`${ETHERBASE_WRITER_URL}/setValue`, {
        contractAddress: ETHERBASE_SOURCE_ADDRESS,
        state: {
          users: {
            [user]: updatedData
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${PRIVATE_KEY}`
        }
      });
      
      console.log(`Updated state for user ${user}, processed ${prayerCount} prayers`);
    }
    
    // Update global stats
    const response = await axios.get(`${ETHERBASE_READER_URL}/state?contractAddress=${ETHERBASE_SOURCE_ADDRESS}&path=global`);
    const globalStats = response.data || {
      totalPendingPrayers: 0,
      totalProcessedPrayers: 0,
      batches: 0
    };
    
    // Update global stats
    const updatedGlobalStats = {
      ...globalStats,
      totalPendingPrayers: Math.max(0, (globalStats.totalPendingPrayers || 0) - batch.totalPrayers),
      totalProcessedPrayers: (globalStats.totalProcessedPrayers || 0) + batch.totalPrayers,
      batches: (globalStats.batches || 0) + 1
    };
    
    // Send update to Etherbase
    await axios.post(`${ETHERBASE_WRITER_URL}/setValue`, {
      contractAddress: ETHERBASE_SOURCE_ADDRESS,
      state: {
        global: updatedGlobalStats
      }
    }, {
      headers: {
        'Authorization': `Bearer ${PRIVATE_KEY}`
      }
    });
    
    console.log('Global stats updated');
    
    // Emit batch processed event
    await axios.post(`${ETHERBASE_WRITER_URL}/emitEvent`, {
      contractAddress: ETHERBASE_SOURCE_ADDRESS,
      name: "BatchProcessed",
      args: {
        userCount: batch.users.length,
        prayerCount: batch.totalPrayers,
        timestamp: Date.now()
      }
    }, {
      headers: {
        'Authorization': `Bearer ${PRIVATE_KEY}`
      }
    });
    
    console.log('BatchProcessed event emitted');
  } catch (error) {
    console.error('Error updating Etherbase state:', error);
  }
}

/**
 * Main function to run on a schedule
 */
async function main() {
  try {
    console.log('Starting batch processor...');
    
    // Process batches
    await processBatches();
    
    console.log('Batch processor completed');
  } catch (error) {
    console.error('Error in batch processor:', error);
  }
}

// Run the script directly if executed
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

// Export for use in other scripts
module.exports = {
  processBatches,
  getPendingPrayers
};