const {Firestore} = require('@google-cloud/firestore');
const fs = require('fs');

// Use your actual Firestore database ID
const DATABASE_ID = 'smartstock-db';

// Initialize Firestore with the correct database ID
const firestore = new Firestore({
  databaseId: DATABASE_ID,
});

// Load JSON data (adjust path if needed)
const customers = JSON.parse(fs.readFileSync('data/customers.json', 'utf8'));

// Import function
async function importToFirestore() {
  const batch = firestore.batch();
  const collection = firestore.collection('customers');

  customers.forEach((customer) => {
    const docRef = collection.doc(customer.customer_id); // Use user_id as document ID
    batch.set(docRef, customer);
  });

  await batch.commit();
  console.log(`Customers imported into Firestore database: ${DATABASE_ID}`);
}

importToFirestore().catch(console.error);
