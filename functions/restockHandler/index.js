console.log("restockHandler index.js loaded");
console.log("Importing getReorderDetails...");
const { getReorderDetails } = require('./bigquery');

console.log("Importing logRestockAlert...");
const { logRestockAlert } = require('./firestore');

console.log("Importing sendRestockAlertEmail...");
const { sendRestockAlertEmail } = require('./sendgrid');

exports.restockHandler = async (message, context) => {
  try {
    // Step 1: Decode and parse message
    const data = Buffer.from(message.data, 'base64').toString();
    const { product_id } = JSON.parse(data);

    const details = await getReorderDetails(product_id);
    if (!details) {
      console.error(`No product details found for: ${product_id}`);
      return;
    }

    const {
      product_name,
      stock_quantity,
      reorder_level,
      reorder_quantity
    } = details;

    console.log(`Received restock check for ${product_id} - ${product_name} (Qty: ${stock_quantity})`);

    // Step 2: Check stock level
    if (stock_quantity >= reorder_level) {
      console.log(`Stock is sufficient for ${product_name} (${stock_quantity} >= ${reorder_level}). No action taken.`);
      return;
    }

    // Step 3: Log to Firestore
    await logRestockAlert({
      product_id,
      product_name,
      stock_quantity,
      reorder_level,
      reorder_quantity,
      status: 'unread'
    });
    console.log(`Restock alert logged for ${product_name}`);

    // Step 4: Send email notification
    await sendRestockAlertEmail(product_name, stock_quantity, reorder_quantity);
    console.log(`Email alert sent for ${product_name}`);
  } catch (err) {
    console.error('Error processing restock message:', err);
  }
};
