import { yahooFinance, ensureYahooConfig } from "./src/lib/nexus/engine.ts";
ensureYahooConfig();
async function run() {
  try {
    const q = await yahooFinance.quote(["PETR4.SA", "INVALID_TICKER_FOR_TEST123.SA", "VALE3.SA"], { return: 'array' } as any);
    console.log(q.map((x: any) => x.regularMarketPrice));
  } catch(e) {
    console.log("FAILED:", e.message);
  }
}
run();
