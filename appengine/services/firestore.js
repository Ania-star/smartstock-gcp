const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore connection 
const db = new Firestore({
  databaseId: 'smartstock-db', 
});

/**
 * Fetch all active customers from the 'customers' collection.
 * This function is typically used to populate dropdowns in the UI.
 * Returns full customer records including contact info, address, location, and registration metadata.
 */
async function getCustomers() {
  const snapshot = await db.collection('customers')
    .where('status', '==', 'Active') // Only fetch customers marked as active
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      customer_id: data.customer_id,             // Unique customer ID
      name: data.name,                           // Customer name
      email: data.email,                         // Contact email
      phone: data.phone,                         // Phone number
      address: data.address,                     // Physical address
      location: data.location,                   // GeoPoint (latitude, longitude)
      registered_date: data.registered_date,     // Firestore Timestamp
      status: data.status                        // Status: active, inactive, etc.
    };
  });
}

/**
 * Log a restock alert in the 'restock_log' collection.
 * This is called by the restockHandler Cloud Function when a product drops below threshold.
 * Required fields must be provided in the 'data' object passed to this function.
 * @param {Object} data - Contains all required fields for the alert
 * @param {string} data.product_id - ID of the product triggering the alert
 * @param {string} data.product_name - Human-readable name of the product
 * @param {number} data.current_quantity - Stock level at the time of alert
 * @param {number} data.reorder_level - Inventory threshold that was crossed
 * @param {number} data.reorder_quantity - Suggested reorder amount
 * @param {string} data.status - Initial alert status: 'unread', 'acknowledged', or 'resolved'
 */
async function logRestockAlert(data) {
  const {
    product_id,
    product_name,
    current_quantity,
    reorder_level,
    reorder_quantity,
    status
  } = data;

  // Create a new document in restock_log with all required fields + generated timestamp
  const docRef = db.collection('restock_log').doc();
  await docRef.set({
    product_id,
    product_name,
    current_quantity,
    reorder_level,
    reorder_quantity,
    timestamp: new Date(), // Log current time of alert creation
    status
  });
}
async function countActiveCustomers() {
  const snapshot = await db.collection('customers')
    .where('status', '==', 'Active')
    .get();

  return snapshot.size;
}
async function addCustomer({ name, email, phone, address, location }) {
  const customer_id = `cust_${Date.now()}`;

  const customerData = {
    customer_id,
    name,
    email,
    phone,
    address,
    location, // { latitude, longitude }
    registered_date: new Date(),
    status: 'Active'
  };

  await db.collection('customers').doc(customer_id).set(customerData);
  return customerData;
}

// Export functions for use in routes or Cloud Functions
module.exports = {
  getCustomers,
  logRestockAlert,
  countActiveCustomers,
  addCustomer
};