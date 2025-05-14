// shared/constants.js

// Pub/Sub Topics
module.exports.ORDER_TOPIC = 'order-topic';
module.exports.RESTOCK_TOPIC = 'restock-topic';

// BigQuery
module.exports.BQ_DATASET = 'finalproject';
module.exports.BQ_INVENTORY_TABLE = 'inventory_baseline';
module.exports.BQ_ORDER_HISTORY_TABLE = 'order_history';
//firestore
module.exports.FIRESTORE_DATABASE_ID = 'smartstock-db'; 
module.exports.CUSTOMERS_COLLECTION = 'customers';
module.exports.RESTOCK_COLLECTION = 'restock_log';
module.exports.RESTOCK_ALERTS_COLLECTION = 'restock_alerts';


console.log("✅ shared/constants.js loaded");

module.exports.ALERT_EMAIL = {
  from: 'abajszcz@purdue.edu',
  to: 'annabajszczak@gmail.com'
};



// General HTTP status (optional)
module.exports.HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  SERVER_ERROR: 500
};
