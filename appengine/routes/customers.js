const express = require('express');
const router = express.Router();
const { countActiveCustomers, getCustomers } = require('../services/firestore');
const { getOrdersByCustomer, getTotalOrderCount, getAverageOrdersPerCustomer, getTopCustomersBySpend} = require('../services/bigquery');

// 1. Total active customers
router.get('/active-count', async (req, res) => {
  try {
    const total = await countActiveCustomers();
    res.json({ total });
  } catch (err) {
    console.error('Error fetching active customer count:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 2. Orders by customer ID
router.get('/orders/:customerId', async (req, res) => {
  try {
    const orders = await getOrdersByCustomer(req.params.customerId);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders for customer:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//3. Total Orders Count
router.get('/order-count', async (req, res) => {
    try {
      const count = await getTotalOrderCount();
      res.json({ count });
    } catch (err) {
      console.error('Error fetching total order count:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  //4. Average Orders Count
  router.get('/average-orders', async (req, res) => {
    try {
      const avg = await getAverageOrdersPerCustomer();
      res.json({ avg });
    } catch (err) {
      console.error('Error fetching average orders:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
//5. Average Order Value
  const { getAverageOrderValue } = require('../services/bigquery');

  router.get('/average-order-value', async (req, res) => {
    try {
      const avgValue = await getAverageOrderValue();
      res.json({ avgValue });
    } catch (err) {
      console.error('Error fetching average order value:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  //6. Total Sales
  const { getTotalOrderValue } = require('../services/bigquery');

  router.get('/total-order-value', async (req, res) => {
    try {
      const totalValue = await getTotalOrderValue();
      res.json({ totalValue });
    } catch (err) {
      console.error('Error fetching average order value:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  //7. Top 5 Customers by Spend
  router.get('/top-spenders', async (req, res) => {
    try {
      const top = await getTopCustomersBySpend();
      const allCustomers = await getCustomers();
  
      const enriched = top.map(row => {
        const match = allCustomers.find(c => c.customer_id === row.customer_id);
        return {
          name: match?.name || row.customer_id,
          total_spent: parseFloat(row.total_spent.toFixed(2))
        };
      });
  
      res.json(enriched);
    } catch (err) {
      console.error('Failed to fetch top spenders:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  const { addCustomer } = require('../services/firestore');

router.post('/', async (req, res) => {
  const { name, email, phone, address, location } = req.body;

  if (!name || !email || !phone || !address || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newCustomer = await addCustomer({ name, email, phone, address, location });
    res.status(201).json(newCustomer);
  } catch (err) {
    console.error('Error adding customer:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
