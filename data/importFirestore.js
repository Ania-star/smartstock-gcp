const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');

// Firestore database ID
const DATABASE_ID = 'smartstock-db';

// Initialize Firestore
const firestore = new Firestore({
  databaseId: DATABASE_ID,
});

// Load JSON data
const customers = JSON.parse(fs.readFileSync('data/customers.json', 'utf8'));

// Import function
async function importToFirestore() {
  const batch = firestore.batch();
  const collection = firestore.collection('customers');

  customers.forEach((customer) => {
    // Firestore will auto-generate a unique document ID
    const docRef = collection.doc();
    batch.set(docRef, customer);
  });

  await batch.commit();
  console.log(`Imported ${customers.length} customers into Firestore (${DATABASE_ID})`);
}

importToFirestore().catch((err) => {
  console.error('Error importing customers:', err);
});
