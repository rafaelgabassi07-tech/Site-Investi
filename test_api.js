fetch('http://localhost:3000/api/historical-fundamentals/SCAR3')
  .then(res => res.json())
  .then(data => console.log('Fundamentals Result:', data))
  .catch(console.error);

fetch('http://localhost:3000/api/dividends/SCAR3')
  .then(res => res.json())
  .then(data => console.log('Dividends count:', data.length))
  .catch(console.error);
