fetch('http://localhost:3000/api/market-stats').then(res => res.text()).then(console.log).catch(console.error);
