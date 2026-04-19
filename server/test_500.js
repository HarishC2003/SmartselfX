const axios = require('axios');
async function test() {
  try {
    const login = await axios.post('http://localhost:5000/api/auth/login', {email: 'vendor1@example.com', password: 'password123'});
    console.log('Login token:', login.data.accessToken);
    
    const mine = await axios.get('http://localhost:5000/api/declarations/mine', {headers: {Authorization: 'Bearer '+login.data.accessToken}});
    const id = mine.data.declarations[0]._id;
    console.log('Declaration ID:', id);

    const patch = await axios.patch('http://localhost:5000/api/declarations/'+id+'/qty', {availableQty: 50}, {headers: {Authorization: 'Bearer '+login.data.accessToken}});
    console.log(patch.data);
  } catch(e) {
    console.log('ERROR:', e.response ? e.response.data : e.message);
  }
}
test();
