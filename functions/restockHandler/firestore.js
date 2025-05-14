const { Firestore } = require('@google-cloud/firestore');

const DATABASE_ID = 'smartstock-db'; 

// Initialize Firestore connection 
const db = new Firestore({
  databaseId: DATABASE_ID,
});

async function logRestockAlert(data) {
  const docRef = db.collection('restock_alerts').doc();
  await docRef.set({
    ...data,
    alert_date: new Date().toISOString()
  });
  console.log(`Document written to Firestore DB: ${DATABASE_ID}`);
}

module.exports = {
  logRestockAlert
};
