const { BigQuery } = require('@google-cloud/bigquery');
const bigqueryClient = new BigQuery();
const { getProductById, logOrder, updateInventory } = require('./bigquery');
const { PubSub } = require('@google-cloud/pubsub');

const pubsub = new PubSub();
const RESTOCK_TOPIC = 'restock-topic';

exports.orderProcessor = async (message, context) => {
  try {
    const order = JSON.parse(Buffer.from(message.data, 'base64').toString());
    console.log("Received order:", order);

    // Fetch product details
    const product = await getProductById(order.product_id);
    if (!product) {
      throw new Error("Product not found.");
    }

    // Check stock availability
    if (product.stock_quantity < order.quantity_ordered) {
      throw new Error(`Insufficient stock for ${product.product_name}. Available: ${product.stock_quantity}, Ordered: ${order.quantity_ordered}`);
    }

    // Log order + update inventory
    await logOrder(order);
    await updateInventory(order.product_id, order.quantity_ordered);
    console.log("Order logged and inventory updated.");


    // Send to restock-topic for evaluation
    await pubsub.topic(RESTOCK_TOPIC).publishMessage({
      data: Buffer.from(JSON.stringify({ product_id: order.product_id }))
    });
    console.log(`Restock check triggered for ${order.product_id}`);

  } catch (error) {
    console.error("Failed to process order:", error);
    throw new Error("Order processing failed");
  }
};
