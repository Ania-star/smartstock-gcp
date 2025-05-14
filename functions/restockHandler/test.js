// Load environment variables
require('dotenv').config({ path: '../../.env' });

// Confirm environment variables loaded
console.log("ENVIRONMENT SETUP");
console.log("SENDGRID_API_KEY (preview):", process.env.SENDGRID_API_KEY?.substring(0, 5) || "Not Found");
console.log("GOOGLE_APPLICATION_CREDENTIALS:", process.env.GOOGLE_APPLICATION_CREDENTIALS || "Not Set");

// Import the Cloud Function
const { restockHandler } = require('./index');

// Simulated Pub/Sub message
const testMessage = {
  data: Buffer.from(JSON.stringify({
    product_id: '95-449-1286' // Update if testing with a different product
  })).toString('base64')
};

// Simulated context object
const testContext = {
  eventId: 'test-event-id',
  timestamp: new Date().toISOString()
};

// Run the Cloud Function test
(async () => {
  console.log("🚀 Starting restockHandler test...\n");

  try {
    await restockHandler(testMessage, testContext);
    console.log('\nRestock handler test completed successfully.');
  } catch (err) {
    console.error('\nError during restock handler test:\n', err);
  }
})();
