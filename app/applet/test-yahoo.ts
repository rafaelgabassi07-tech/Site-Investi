import yahooFinancePkg from "yahoo-finance2";
const yahooFinance = yahooFinancePkg.default || yahooFinancePkg;
(async () => {
  try {
    const data = await yahooFinance.quote("^BVSP");
    console.log(data.regularMarketPrice);
  } catch (e) {
    console.error("ERROR CAUGHT:");
    console.error(e);
  }
})();
