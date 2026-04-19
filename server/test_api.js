import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@smartshelfx.com',
      password: 'Admin@12345'
    });
    const token = loginRes.data.accessToken; 
    
    console.log('--- TEST 1: isActive=false ---');
    const res1 = await axios.get('http://localhost:5000/api/products?isActive=false', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Count Inactive:', res1.data.products.length);

    console.log('--- TEST 2: isPerishable=true ---');
    const res2 = await axios.get('http://localhost:5000/api/products?isPerishable=true', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Count Perishable (active only):', res2.data.products.length);

    console.log('--- TEST 3: isPerishable=true & isActive=false ---');
    const res3 = await axios.get('http://localhost:5000/api/products?isPerishable=true&isActive=false', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Count Perishable Inactive:', res3.data.products.length);

  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
