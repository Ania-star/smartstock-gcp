// testSendEmail.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'annabajszczak@gmail.com', // change to your test recipient
  from: 'abajszcz@purdue.edu', // your verified sender
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent');
  })
  .catch((error) => {
    console.error(error);
  });
