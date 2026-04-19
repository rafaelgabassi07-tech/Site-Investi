import yahooFinance from 'yahoo-finance2';
console.log(Object.keys(yahooFinance));
try {
  yahooFinance.quote('AAPL').then(console.log).catch(console.error);
} catch(e) {
  console.log('Sync Error:', e);
}
