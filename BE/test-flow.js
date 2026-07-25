const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb+srv://admin:2005huuphuc@cluster0.xbuducm.mongodb.net/minimart_db';
const secret = '4/h7CrbCxSpGbCk94tUVZbZY4dnhpXOWAt7jLfZh2w8mTeAB9vJFZhu9CLi8ReOkjvWpTjPyA5pSrWrSAQ8u/w==';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const admin = await User.findOne({ role: 'admin' });
  
  if (!admin) {
    console.log('No admin found');
    process.exit(1);
  }

  const token = jwt.sign({ id: admin._id.toString(), role: 'admin' }, secret, { expiresIn: '1h' });

  // 1. Get products
  const getRes = await fetch('http://localhost:5000/api/competitor-products?limit=5', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getData = await getRes.json();
  const products = getData.data;
  
  if (!products || products.length === 0) {
    console.log('No products found to test delete.');
    process.exit(0);
  }
  
  const idsToDelete = products.slice(0, 2).map(p => p._id);
  console.log('Attempting to delete IDs:', idsToDelete);
  
  // 2. Delete
  const deleteRes = await fetch('http://localhost:5000/api/competitor-products/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ids: idsToDelete })
  });
  
  console.log('Delete status:', deleteRes.status);
  console.log('Delete response:', await deleteRes.text());
  
  process.exit(0);
}

run().catch(console.error);
