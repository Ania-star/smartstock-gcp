const express = require('express');
const router = express.Router();
const { PubSub } = require('@google-cloud/pubsub');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');


const { getCustomers } = require('../services/firestore');
const {
  getProductCategories,
  getProductsByCategory,
  getProductById
} = require('../services/bigquery');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const pubsub = new PubSub();
const ORDER_TOPIC = 'order-topic';

// GET /order/form-data?category=...
router.get('/form-data', async (req, res) => {
  try {
    const [customers, categories] = await Promise.all([
      getCustomers(),
      getProductCategories()
    ]);

    let products = [];
    if (req.query.category) {
      products = await getProductsByCategory(req.query.category);
    }

    res.json({ customers, categories, products });
  } catch (err) {
    console.error('Error fetching form data:', err);
    res.status(500).json({ error: 'Failed to load order form data' });
  }
});

// POST /order — handles both single and multi-item format

router.post('/', async (req, res) => {
  const { customer_id, product_id, quantity, items } = req.body;

  const multi = Array.isArray(items);
  if (!customer_id || (multi && items.length === 0)) {
    return res.status(400).json({ error: 'Missing required order fields' });
  }

  try {
    const customers = await getCustomers();
    const customer = customers.find(c => c.customer_id === customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const itemList = multi ? items : [{ product_id, quantity }];
    
    const order_id = uuidv4();
    for (const item of itemList) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) continue;

      const product = await getProductById(product_id);
      if (!product) continue;

      const orderPayload = {
        order_id, 
        customer_id,
        product_id,
        product_name: product.product_name,
        quantity_ordered: Number(quantity),
        unit_price: product.unit_price,
        total_price: product.unit_price * quantity,
        timestamp: new Date().toISOString()
      };


      const dataBuffer = Buffer.from(JSON.stringify(orderPayload));
      await pubsub.topic(ORDER_TOPIC).publishMessage({ data: dataBuffer });
    }
    
    console.log(`Submitted order ${order_id} with ${itemList.length} item(s)`);

    res.status(200).json({ status: 'success', message: 'Order submitted successfully' });

  } catch (err) {
    console.error('Error submitting order:', err);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

module.exports = router;
