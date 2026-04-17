import yahooFinanceRaw from 'yahoo-finance2';
console.log("Keys on default export:", Object.keys(yahooFinanceRaw));
if (typeof yahooFinanceRaw === 'function') {
  console.log("Static keys:", Object.keys(yahooFinanceRaw));
  const instance = new (yahooFinanceRaw as any)();
  console.log("Instance keys:", Object.keys(instance));
  console.log("Instance prototype keys:", Object.keys(Object.getPrototypeOf(instance)));
}
