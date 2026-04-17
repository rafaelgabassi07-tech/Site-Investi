fetch('https://investidor10.com.br/acoes/bbas3/')
  .then(res => res.text())
  .then(text => {
    const idx = text.indexOf('table-dividends');
    if (idx !== -1) {
      console.log(text.substring(idx - 100, idx + 1000));
    } else {
      console.log("table-dividends not found.");
      const id2 = text.indexOf('id="dividends"');
      if (id2 !== -1) console.log(text.substring(id2, id2 + 1500));
      else console.log("Not found at all.");
    }
  })
  .catch(console.error);
