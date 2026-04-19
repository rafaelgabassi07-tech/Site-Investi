import yahooFinance from 'yahoo-finance2';
async function run() {
  try {
    const q1 = await yahooFinance.quote('^BVSP');
    console.log('BVSP:', q1.regularMarketPrice);
    
    // Check if USDBRL=X is allowed
    const q2 = await yahooFinance.quote('USDBRL=X');
    console.log('USD:', q2.regularMarketPrice);
  } catch (e) {
    console.log('Error output:', e);
  }
}
run();
