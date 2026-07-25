const jwt = require('jsonwebtoken');
const secret = '4/h7CrbCxSpGbCk94tUVZbZY4dnhpXOWAt7jLfZh2w8mTeAB9vJFZhu9CLi8ReOkjvWpTjPyA5pSrWrSAQ8u/w==';

const token = jwt.sign({ id: '123', role: 'admin' }, secret, { expiresIn: '1h' });

async function run() {
  const deleteRes = await fetch('http://localhost:5000/api/competitor-products/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ids: ['64ca65851234567890123456', '64ca65851234567890123457'] })
  });
  
  console.log('Delete status:', deleteRes.status);
  console.log('Delete response:', await deleteRes.text());
}

run();
