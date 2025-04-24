/**
 * Batch Service for Faith Token
 * 
 * This script runs a scheduled batch processor that processes prayers in batches
 * on a regular schedule.
 */
const cron = require('node-cron');
const { processBatches } = require('./batch-processor');
require('dotenv').config();

// Configuration
const CRON_SCHEDULE = process.env.BATCH_CRON_SCHEDULE || '*/15 * * * *'; // Default: every 15 minutes

console.log(`Starting Faith Token Batch Service`);
console.log(`Schedule: ${CRON_SCHEDULE}`);

// Schedule regular batch processing
cron.schedule(CRON_SCHEDULE, async () => {
  console.log(`\n[${new Date().toISOString()}] Running scheduled batch processing`);
  
  try {
    await processBatches();
    console.log(`[${new Date().toISOString()}] Batch processing completed successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in scheduled batch processing:`, error);
  }
});

// Process batches immediately on startup
(async () => {
  console.log(`\n[${new Date().toISOString()}] Running initial batch processing on startup`);
  
  try {
    await processBatches();
    console.log(`[${new Date().toISOString()}] Initial batch processing completed successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in initial batch processing:`, error);
  }
})();

// Keep the service running
console.log('Batch service running...');
console.log('Press Ctrl+C to stop the service');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down batch service...');
  process.exit(0);
});