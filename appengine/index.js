// index.js (App Engine server)
//require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
console.log("SENDGRID:", process.env.SENDGRID_API_KEY?.substring(0, 3));
console.log("GOOGLE CREDS:", process.env.GOOGLE_APPLICATION_CREDENTIALS);


const express = require('express');
const bodyParser = require('body-parser');
//const path = require('path');
const app = express();


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Import & register routes
const orderRoutes = require('./routes/order');
const mapRoutes = require('./routes/map');
const customerRoutes = require('./routes/customers');

app.use('/order', orderRoutes);
app.use('/map', mapRoutes);  
app.use('/customers', customerRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('SmartStock App Engine is running!');
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`SmartStock App Engine is listening on port ${PORT}`);
});