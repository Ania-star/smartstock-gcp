console.log("sendgrid.js loaded");

const sgMail = require('@sendgrid/mail');

async function sendRestockAlertEmail(product_name, stock_quantity, reorder_quantity) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    from: 'enter_registered@email.com',
    to: 'enter@email.com',
    subject: `Restock Alert: ${product_name}`,
    text: `Inventory Alert from SmartStock System\n\nProduct: ${product_name}\nCurrent Stock: ${stock_quantity}\nReorder Suggestion: ${reorder_quantity} units\n\nThis is a system-generated alert to help ensure inventory levels remain optimal.\n\nThank you,\nSmartStock System`
  };

  await sgMail.send(msg);
}

module.exports = {
  sendRestockAlertEmail
};
