const fetch = require('node-fetch');

fetch('https://investidor10.com.br/acoes/bbas3/')
  .then(res => res.text())
  .then(text => {
    const idx = text.indexOf('table-dividends');
    if (idx !== -1) {
      console.log(text.substring(idx - 100, idx + 1000));
    } else {
      console.log("table-dividends not found.");
      const matches = text.match(/<table(.*?)<\/table>/gi);
      if (matches) {
          console.log(matches.find(m => m.includes('Data Com')));
      }
    }
  })
  .catch(console.error);
