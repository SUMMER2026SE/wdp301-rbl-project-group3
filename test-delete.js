const http = require('http');

async function run() {
  try {
    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@system.com', password: 'password123' })
    });
    
    if (!loginRes.ok) {
      console.log('Login failed:', loginRes.status, await loginRes.text());
      return;
    }
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    
    console.log('Logged in. Token:', token.substring(0, 20) + '...');
    
    // Delete test
    const deleteRes = await fetch('http://localhost:5000/api/competitor-products/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: ['invalidid1', 'invalidid2'] })
    });
    
    console.log('Delete status:', deleteRes.status);
    console.log('Delete response:', await deleteRes.text());
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
