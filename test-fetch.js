async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/quotes/batch?tickers=PETR4,VALE3,ITUB4");
    const json = await res.json();
    console.log("BATCH:", json);
  } catch(e) { console.error(e) }

  try {
    const res = await fetch("http://localhost:3000/api/market-stats");
    const json = await res.json();
    console.log("MARKET STATS:", json);
  } catch(e) { console.error(e) }
}
run();
