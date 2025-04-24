import { EtherbaseConfig, somnia } from "@msquared/etherbase-client";
import { EtherbaseProvider, useEtherbaseSource, useEtherstore, useEtherbaseEvents } from "@msquared/etherbase-client";

// Etherbase configuration
const etherbaseConfig = {
  chain: somnia, // Use Somnia chain
  useBackend: true, // Use backend service
  httpReaderUrl: "https://etherbase-reader-496683047294.europe-west2.run.app",
  wsReaderUrl: "wss://etherbase-reader-496683047294.europe-west2.run.app",
  wsWriterUrl: "wss://etherbase-writer-496683047294.europe-west2.run.app",
  // privateKey will be added dynamically when user connects
};

// Etherbase Source contract address (to be filled after creation)
const ETHERBASE_SOURCE_ADDRESS = "";

/**
 * Initialize Etherbase with the user's private key (if available)
 * @param {string} privateKey Optional private key for backend auth
 * @returns {EtherbaseConfig} The configured Etherbase config
 */
export const initEtherbase = (privateKey) => {
  if (privateKey) {
    etherbaseConfig.privateKey = privateKey;
  }
  return etherbaseConfig;
};

/**
 * Create a prayer record in Etherbase state
 * @param {string} userAddress User's wallet address
 * @returns {Promise<void>}
 */
export const recordPrayer = async (userAddress) => {
  const { setValue } = useEtherbaseSource({
    sourceAddress: ETHERBASE_SOURCE_ADDRESS,
  });
  
  // Get current state
  const { state } = useEtherstore([ETHERBASE_SOURCE_ADDRESS, "users", userAddress]);
  
  // Current pending prayers (default to 0 if not set)
  const pendingPrayers = state?.pendingPrayers || 0;
  const totalPrayers = state?.totalPrayers || 0;
  
  // Update state with new prayer
  await setValue({
    users: {
      [userAddress]: {
        pendingPrayers: pendingPrayers + 1,
        totalPrayers: totalPrayers + 1,
        lastPrayTime: Date.now()
      }
    }
  });
  
  // Emit prayer event
  const { emitEvent } = useEtherbaseSource({
    sourceAddress: ETHERBASE_SOURCE_ADDRESS,
  });
  
  await emitEvent({
    name: "UserPrayed",
    args: {
      user: userAddress,
      timestamp: Date.now(),
    },
  });
};

/**
 * Get a user's prayer stats from Etherbase
 * @param {string} userAddress User's wallet address
 * @returns {Promise<Object>} User's prayer stats
 */
export const getUserPrayerStats = async (userAddress) => {
  const { state } = useEtherstore([ETHERBASE_SOURCE_ADDRESS, "users", userAddress]);
  
  // Return stats with defaults for undefined values
  return {
    pendingPrayers: state?.pendingPrayers || 0,
    totalPrayers: state?.totalPrayers || 0,
    lastPrayTime: state?.lastPrayTime || 0,
    lastClaimTime: state?.lastClaimTime || 0,
  };
};

/**
 * Get global prayer stats from Etherbase
 * @returns {Promise<Object>} Global prayer stats
 */
export const getGlobalPrayerStats = async () => {
  const { state } = useEtherstore([ETHERBASE_SOURCE_ADDRESS, "global"]);
  
  // Return stats with defaults for undefined values
  return {
    totalPendingPrayers: state?.totalPendingPrayers || 0,
    totalProcessedPrayers: state?.totalProcessedPrayers || 0,
    batches: state?.batches || 0,
    remainingSupply: state?.remainingSupply || 666666666,
  };
};

/**
 * Subscribe to batch processing events
 * @param {Function} onBatchProcessed Callback when a batch is processed
 * @returns {Object} Error object if any
 */
export const subscribeToBatchEvents = (onBatchProcessed) => {
  const { error } = useEtherbaseEvents({
    contractAddress: ETHERBASE_SOURCE_ADDRESS,
    events: [{ name: "BatchProcessed" }],
    onEvent: (event) => {
      if (onBatchProcessed) {
        onBatchProcessed(event);
      }
    },
  });
  
  return { error };
};

/**
 * Update Etherbase state after batch processing
 * @param {string} userAddress User's wallet address
 * @param {number} processedPrayers Number of prayers processed
 * @returns {Promise<void>}
 */
export const updateAfterBatchProcessing = async (userAddress, processedPrayers) => {
  const { setValue } = useEtherbaseSource({
    sourceAddress: ETHERBASE_SOURCE_ADDRESS,
  });
  
  // Get current state
  const { state } = useEtherstore([ETHERBASE_SOURCE_ADDRESS, "users", userAddress]);
  
  // Calculate new pending prayers
  const pendingPrayers = Math.max(0, (state?.pendingPrayers || 0) - processedPrayers);
  
  // Update state
  await setValue({
    users: {
      [userAddress]: {
        pendingPrayers: pendingPrayers,
        lastClaimTime: Date.now()
      }
    }
  });
};

export { EtherbaseProvider };
