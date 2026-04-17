fetch('http://localhost:3000/api/history/SCAR3?period=5y')
  .then(res => res.json())
  .then(data => console.log('History sample:', data[0], data[data.length-1]))
  .catch(console.error);
