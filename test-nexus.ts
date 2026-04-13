import { NexusEngine } from './src/lib/nexus/engine.ts';
import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const yf = new (yahooFinance as any)();
    console.log('Successfully instantiated yahooFinance');
    const quote = await yf.quote('^BVSP');
    console.log('Quote:', quote.regularMarketPrice);
  } catch (e) {
    console.error('Failed to instantiate or call quote:', e);
  }
  
  console.log('Testing PETR4 via NexusEngine...');
  const result = await NexusEngine.fetchAtivo('PETR4', 'ACAO');
  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
