console.log("bigquery.js loaded");

// restockHandler/bigquery.js
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery({ projectId: 'sp25-50100-teamgold' });

async function getReorderDetails(product_id) {
  const query = `
    SELECT
      product_name,
      stock_quantity,
      reorder_level,
      reorder_quantity
    FROM \`sp25-50100-teamgold.finalproject.inventory_baseline\`
    WHERE product_id = @product_id
    LIMIT 1
  `;
  const [rows] = await bigquery.query({
    query,
    params: { product_id }
  });
  return rows[0];
}

module.exports = {
  getReorderDetails
};
