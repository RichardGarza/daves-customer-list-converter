const { json } = require('body-parser');
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;

// This tells multer to use RAM for temp storage
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

// Index HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// POST JSON customer list
app.post('/', upload.single('JSON-Customer-List'), (req, res) => {
  let customers = JSON.parse(req.file.buffer);

  // Clear old / create new processedList and redefine Header for CSV export later
  fs.writeFileSync(
    'processedList.csv',
    '"First Name (Shipping)"|"Last Name (Shipping)"|"Mixed Bags"| "Chia Seeds"| "Celery Stalks"|"Address 1&2 (Shipping)"|"City (Shipping)"|"State Code (Shipping)"|"Postcode (Shipping)"|"Phone (Billing)"|Donation|"Customer Note"'
  );

  // Run thru list of customers from request body with forEach loop
  customers.forEach(customer => {
    // Destructure needed info from each customer
    const {
      products,
      shipping_first_name: firstName,
      shipping_last_name: lastName,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_postcode,
      billing_phone,
      customer_note,
    } = customer;

    // Count how many of what they ordered
    let bagCount = 0;
    let celeryCount = 0;
    let chiaCount = 0;
    let donation = '';

    products.forEach(product => {
      let { sku, qty } = product;
      if (sku === '001') {
        bagCount = qty;
      } else if (sku === '020') {
        chiaCount = qty;
      } else if (sku === '021') {
        celeryCount = qty;
      } else if (sku === 'donation-3766') {
        donation = 'yes';
      }
    });

    // Format info for CSV export
    const content = `\r\n${firstName}|${lastName}|${bagCount}|${chiaCount}|${celeryCount}|${shipping_address}|${shipping_city}|${shipping_state}|${shipping_postcode}|${billing_phone}|${donation}|${customer_note}`;

    // Append to processed list
    fs.appendFileSync('processedList.csv', content);
  });

  // Once all customers' orders are added, append tallying formulas
  let lastRow = customers.length + 1;
  const content = `\r\n||=SUM(C2:C${lastRow})|=SUM(D2:D${lastRow})|=SUM(E2:E${lastRow})|||||||`;

  fs.appendFileSync('processedList.csv', content);

  // Now that file is complete, initiate download to user's computer
  const file = __dirname + '/processedList.csv';
  res.download(file);
});

app.listen(port, () => {
  console.log(`Dave's app is listening at http://localhost:${port}`);
});
