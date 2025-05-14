const { BigQuery } = require('@google-cloud/bigquery');
// Import UUID generator to create unique order IDs
const { randomUUID } = require('crypto');

/**
 * Initialize BigQuery client
 */
const bigquery = new BigQuery(); // uses default credentials/project

/**
 * Dataset and table constants
 * These are used in query strings to keep things consistent.
 */
const DATASET_ID = 'finalproject';  // BigQuery dataset
const INVENTORY_TABLE = `${DATASET_ID}.inventory_baseline`;  // Inventory table
const ORDER_TABLE = `${DATASET_ID}.order_history`;           // Order history table


/**
 * getInventory()
 * Returns all active products with product_id and product_name.
 * Used in: Frontend dropdown for product selection in /order form.
 */
async function getInventory() {
    const query = `
      SELECT product_id, product_name
      FROM \`${INVENTORY_TABLE}\`
      WHERE status = 'Active'
      ORDER BY product_name
    `;
    const [rows] = await bigquery.query({ query });
    return rows;
  }
  
  /**
   * getProductCategories()
   * Returns a list of unique categories for active products.
   * Used in: Frontend category dropdown to filter inventory.
   */
  async function getProductCategories() {
    const query = `
      SELECT DISTINCT category
      FROM \`${INVENTORY_TABLE}\`
      WHERE status = 'Active' AND category IS NOT NULL
      ORDER BY category
    `;
    const [rows] = await bigquery.query({ query });
    return rows.map(row => row.category);
  }
  
  /**
   * getProductsByCategory(category)
   * Returns products within a selected category that are active.
   * Used in: Cascading product dropdown based on selected category.
   */
  async function getProductsByCategory(category) {
    const query = `
      SELECT product_id, product_name
      FROM \`${INVENTORY_TABLE}\`
      WHERE status = 'Active' AND category = @category
      ORDER BY product_name
    `;
    const [rows] = await bigquery.query({
      query,
      params: { category }
    });
    return rows;
  }
  
  /**
   * getProductById(product_id)
   * Returns the full product record for a given product_id.
   * Used in: Backend validation during order placement (stock, price, reorder logic).
   */
  async function getProductById(product_id) {
    const query = `
      SELECT *
      FROM \`${INVENTORY_TABLE}\`
      WHERE product_id = @product_id
      LIMIT 1
    `;
    const [rows] = await bigquery.query({
      query,
      params: { product_id }
    });
    return rows[0];
  }

/**
 * updateInventory(product_id, quantityOrdered)
 * Updates inventory_baseline:
 * - Decreases stock_quantity
 * - Increases sales_volume
 * - Updates last_order_date
 * Used in: orderProcessor Cloud Function after order is validated.
 */
async function updateInventory(product_id, quantityOrdered) {
  const query = `
    UPDATE \`${INVENTORY_TABLE}\`
    SET 
      stock_quantity = stock_quantity - @quantityOrdered,
      sales_volume = IFNULL(sales_volume, 0) + @quantityOrdered,
      last_order_date = CURRENT_DATE()
    WHERE product_id = @product_id
  `;
  const [job] = await bigquery.createQueryJob({
    query,
    params: { product_id, quantityOrdered }
  });
  await job.getQueryResults();
}

/**
 * logOrder(order)
 * Inserts a new record into order_history with auto-generated order_id and timestamp.
 * Used in: orderProcessor Cloud Function or directly from App Engine backend.
 */
async function logOrder(order) {
  const row = {
    order_id: `ORD-${randomUUID()}`,
    customer_id: order.customer_id,
    product_id: order.product_id,
    product_name: order.product_name,
    quantity_ordered: order.quantity_ordered,
    unit_price: order.unit_price,
    total_price: order.total_price,
    timestamp: new Date().toISOString(),
    order_status: 'Pending'
  };

  await bigquery.dataset(DATASET_ID)
    .table('order_history')
    .insert([row]);
}

/**
 * getOrdersByCustomer(customer_id)
 * Fetches all orders placed by a specific customer.
 * Used in: Customer detail views, dashboards, or My Orders section.
 */
async function getOrdersByCustomer(customer_id) {
  const query = `
    SELECT *
    FROM \`${ORDER_TABLE}\`
    WHERE customer_id = @customer_id
    ORDER BY timestamp DESC
  `;
  const [rows] = await bigquery.query({
    query,
    params: { customer_id }
  });
  return rows;
}

// === ADMIN UTILITIES (Future Use) === //

/**
 * getAllProducts()
 * Returns all products, regardless of status.
 * Used in: Admin dashboards, product audits.
 */
async function getAllProducts() {
  const query = `
    SELECT product_id, product_name, category, status
    FROM \`${INVENTORY_TABLE}\`
    ORDER BY product_name
  `;
  const [rows] = await bigquery.query({ query });
  return rows;
}

/**
 * getProductStatusCounts()
 * Returns count of products grouped by their status.
 * Used in: Admin analytics widgets or stock status overviews.
 */
async function getProductStatusCounts() {
  const query = `
    SELECT status, COUNT(*) AS count
    FROM \`${INVENTORY_TABLE}\`
    GROUP BY status
    ORDER BY count DESC
  `;
  const [rows] = await bigquery.query({ query });
  return rows;
}

/**
 * getInactiveProducts()
 * Returns products that are NOT marked as 'Active'.
 * Used in: Admin inventory cleanup or review screens.
 */
async function getInactiveProducts() {
  const query = `
    SELECT *
    FROM \`${INVENTORY_TABLE}\`
    WHERE status != 'Active'
    ORDER BY status, product_name
  `;
  const [rows] = await bigquery.query({ query });
  return rows;
}
async function getTotalOrderCount() {
  const query = `
    SELECT COUNT(*) AS total_orders
    FROM \`${ORDER_TABLE}\`
  `;
  const [rows] = await bigquery.query({ query });
  return rows[0].total_orders;
}
async function getAverageOrdersPerCustomer() {
  const query = `
    SELECT COUNT(*) / COUNT(DISTINCT customer_id) AS avg_orders
    FROM \`${ORDER_TABLE}\`
  `;
  const [rows] = await bigquery.query({ query });
  return parseFloat(rows[0].avg_orders.toFixed(2));
}
async function getAverageOrderValue() {
  const query = `
    SELECT AVG(total_price) AS avg_value
    FROM \`${ORDER_TABLE}\`
  `;
  const [rows] = await bigquery.query({ query });
  return parseFloat(rows[0].avg_value.toFixed(2));
}
async function getTotalOrderValue() {
  const query = `
    SELECT SUM(total_price) AS total_value
    FROM \`${ORDER_TABLE}\`
  `;
  const [rows] = await bigquery.query({ query });
  return parseFloat(rows[0].total_value.toFixed(2));
}
async function getTopCustomersBySpend(limit = 5) {
  const query = `
    SELECT customer_id, SUM(total_price) AS total_spent
    FROM \`${ORDER_TABLE}\`
    GROUP BY customer_id
    ORDER BY total_spent DESC
    LIMIT @limit
  `;
  const [rows] = await bigquery.query({
    query,
    params: { limit }
  });
  return rows;
}

// Export all functions for use in App Engine routes or Cloud Functions
module.exports = {
  getInventory,
  getProductById,
  updateInventory,
  logOrder,
  getProductCategories,
  getProductsByCategory,
  getOrdersByCustomer,

  getAllProducts,
  getProductStatusCounts,
  getInactiveProducts,
  getTotalOrderCount,
  getAverageOrdersPerCustomer,
  getAverageOrderValue,
  getTotalOrderValue,
  getTopCustomersBySpend
};