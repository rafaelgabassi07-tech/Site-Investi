import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function run() {
  try {
    const historical = await yahooFinance.historical('PETR4.SA', {
      period1: '2020-01-01',
      events: 'dividends'
    });
    console.log(historical.slice(0, 5));
  } catch(e) {
    console.error(e);
  }
}
run();
