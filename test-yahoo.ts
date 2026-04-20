import { yahooFinance, ensureYahooConfig } from "./src/lib/nexus/engine.ts";
ensureYahooConfig();
async function run() {
  try {
    const q = await yahooFinance.quote(["PETR4.SA", "VALE3.SA"]);
    console.log(Array.isArray(q));
    console.log(q.map((x: any) => x.regularMarketPrice));
  } catch(e) {
    console.log(e);
  }
}
run();
