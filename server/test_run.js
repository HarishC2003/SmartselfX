const test = async () => {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST', body: JSON.stringify({email: 'vendor1@example.com', password: 'password123'}), headers: {'Content-Type': 'application/json'}
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Token:', !!token);

  const mineRes = await fetch('http://localhost:5000/api/declarations/mine', {headers: {Authorization: 'Bearer '+token}});
  const decs = (await mineRes.json()).declarations;
  if(!decs || decs.length===0) return console.log('No decs');
  const id = decs[0]._id;

  const putRes = await fetch('http://localhost:5000/api/declarations/'+id, {
    method: 'PUT',
    body: JSON.stringify({
      productName: 'Test Product Updated',
      sku: 'TEST-123-MOD',
      description: 'Updated',
      unit: 'PCS',
      availableQty: 150,
      unitPrice: 55
    }),
    headers: { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' }
  });
  console.log(await putRes.json());
};
test();
