import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { NexusEngine, inferAssetType, formatYahooError, yahooFinance, ensureYahooConfig } from "../src/lib/nexus/engine.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverPromise: Promise<{ app: express.Express, PORT: number }> | null = null;

export async function createServer() {
  if (serverPromise) return serverPromise;

  serverPromise = (async () => {
    ensureYahooConfig();
    const app = express();
    const PORT = parseInt(process.env.PORT || "3000", 10);

    app.use(cors());
    app.use(express.json());

    // Debug Logger
    app.use((req, res, next) => {
      console.log(`[NEXUS SERVER] ${req.method} ${req.url} (PORT: ${PORT})`);
      next();
    });

    // API Routes
    app.get("/api/check-ver", (_req, res) => {
      res.json({ version: "v3-nuclear", time: new Date().toISOString() });
    });

    app.get("/api/ai/sentiment", async (_req, res) => {
      console.log("[API AI] Hit sentiment");
      try {
        const model = new GoogleGenAI(process.env.GEMINI_API_KEY || "").getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Dê um insight curto (máximo 15 palavras) e profissional em português sobre o sentimento atual do mercado brasileiro (Ibovespa) de forma técnica e analítica.";
        const result = await model.generateContent(prompt);
        res.json({ text: result.response.text().trim() });
      } catch (e: any) {
        console.error("[API AI] Sentiment error:", e);
        res.status(500).json({ error: e.message });
      }
    });

    app.post("/api/ai/ask", async (req, res) => {
      console.log("[API AI] Hit ask", req.body?.question);
      const { question, context } = req.body;
      try {
        const model = new GoogleGenAI(process.env.GEMINI_API_KEY || "").getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Você é a Nexus AI, o cérebro de uma plataforma de investimentos profissional. 
        Responda de forma curta, técnica, direta e ligeiramente futurista. Inclua emojis técnicos se apropriado.
        Contexto do Usuário: ${JSON.stringify(context || {})}
        Pergunta: ${question}`;
        
        const result = await model.generateContent(prompt);
        res.json({ text: result.response.text().trim() });
      } catch (e: any) {
        console.error("[API AI] Ask error:", e);
        res.status(500).json({ error: e.message });
      }
    });

    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok", time: new Date().toISOString() });
    });

    // Removed duplicate AI routes from here
    
    app.get("/api/search", async (req, res) => {
      const { q } = req.query;
      try {
        const result = await NexusEngine.searchTicker(q as string);
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/search q=${q}:`, error);
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/search-suggestions", async (req, res) => {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      try {
        const result = await NexusEngine.searchSuggestions(q);
        res.json(result);
      } catch (error) {
        console.error(`[API] Error fetching search suggestions for ${q}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/news", async (req, res) => {
      const { ticker } = req.query;
      try {
        const result = await NexusEngine.fetchNews((ticker as string) || "IBOVESPA");
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/news ticker=${ticker}:`, error);
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/ranking", async (req, res) => {
      const { category, type } = req.query;
      
      // Set a local timeout for the ranking call to prevent proxy timeouts
      let completed = false;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => { if (!completed) reject(new Error("Ranking fetch timeout")); }, 25000);
      });

      try {
        const fetchPromise = NexusEngine.fetchRanking((category as string) || "Dividend Yield", (type as any) || "ACAO");
        const result = await Promise.race([fetchPromise, timeoutPromise]) as any[];
        completed = true;
        res.json(result);
      } catch (error) {
        completed = true;
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/ranking ${category}:`, error);
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/test-div", async (_req, res) => {
      try {
        const historical = await yahooFinance.historical('PETR4.SA', {
          period1: '2020-01-01',
          events: 'dividends',
          validate: false
        } as any);
        res.json(historical);
      } catch(e: any) { res.status(500).json({error: formatYahooError(e)}); }
    });

    app.get("/api/market-stats", async (_req, res) => {
      const tickers = [
        { sym: "^BVSP", label: "IBOVESPA" },
        { sym: "^GSPC", label: "S&P 500" },
        { sym: "USDBRL=X", label: "DÓLAR" },
        { sym: "BTC-USD", label: "BITCOIN" },
        { sym: "IFIX.SA", label: "IFIX" }
      ];
      try {
        const querySyms = tickers.map(t => t.sym);
        const quotes = await yahooFinance.quote(querySyms, { return: 'array' } as any);
        
        const results = tickers.map(({ sym, label }) => {
          const data = quotes.find((q: any) => q.symbol === sym);
          const preco = data?.regularMarketPrice;
          const change = data?.regularMarketChangePercent;
          const strChange = change != null ? (change > 0 ? '+' : '') + change.toFixed(2) + '%' : '0.00%';
          
          return {
            ticker: sym,
            label,
            price: typeof preco === 'number' && preco > 0 ? preco.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '---',
            value: typeof preco === 'number' && preco > 0 ? preco.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '---',
            change: strChange,
            color: change && change < 0 ? 'red' : 'emerald'
          };
        });

        res.json(results);
      } catch (error) {
        console.error(`[API] Critical error in market-stats:`, error);
        res.status(500).json({ error: 'Failed to fetch market stats', details: (error as Error).message });
      }
    });

    app.get("/api/screener", async (req, res) => {
      const { type, ...filters } = req.query;
      try {
        const result = await NexusEngine.screener(filters, (type as any) || "ACAO");
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/asset/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { type } = req.query;
      const resolvedType = type ? (type as any) : inferAssetType(ticker);
      try {
        const data = await NexusEngine.fetchAtivo(ticker, resolvedType);
        res.json(data);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/asset/${ticker}:`, error);
        res.status(500).json({ 
          error: "Failed to fetch asset details", 
          details: formatYahooError(error) 
        });
      }
    });

    app.get("/api/quotes/batch", async (req, res) => {
      const { tickers } = req.query;
      if (!tickers || typeof tickers !== 'string') {
        return res.status(400).json({ error: "Tickers parameter is required as a comma-separated list." });
      }

      const tickerList = tickers.split(',').map(t => t.trim().toUpperCase()).filter(t => t.length > 0);
      
      try {
        const querySyms = tickerList.map(t => {
           if (t.includes('^') || t.includes('=') || t.includes('-USD') || t.endsWith('.SA')) return t;
           return `${t}.SA`; 
        });

        const quotes = await yahooFinance.quote(querySyms, { return: 'array' } as any);
        
        const results = tickerList.map((originalTicker, idx) => {
          const yt = querySyms[idx];
          const data = quotes.find((q: any) => q.symbol === yt);
          
          if (data) {
             return {
               ticker: originalTicker,
               price: data.regularMarketPrice || 0,
               currency: data.currency || 'BRL',
               change: data.regularMarketChangePercent != null ? `${data.regularMarketChangePercent > 0 ? '+' : ''}${data.regularMarketChangePercent.toFixed(2)}%` : '0.00%',
               name: data.longName || data.shortName || originalTicker,
               type: inferAssetType(originalTicker)
             };
          } else {
             // Fallback to fetchAtivo if it's missing from fast quote
             return { ticker: originalTicker, price: 0, change: '0.00%', error: true, currency: 'BRL' };
          }
        });

        res.json(results);
      } catch (error) {
        console.error(`[API] Critical error in /api/quotes/batch:`, error);
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/exchange-rate", async (_req, res) => {
      try {
        const data = await NexusEngine.fetchAtivo('USDBRL=X', 'STOCK');
        res.json({ rate: data.results?.precoAtual || 5.25 });
      } catch (error) {
        res.json({ rate: 5.25 });
      }
    });

    app.get("/api/history/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { period } = req.query;
      try {
        const data = await NexusEngine.fetchHistoricoGrafico(ticker, (period as any) || '1y');
        res.json(data);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/history/${ticker}:`, error);
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/dividends/:ticker", async (req, res) => {
      const { ticker } = req.params;
      try {
        const data = await NexusEngine.fetchDividends(ticker);
        res.json(data);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/dividends/${ticker}:`, error);
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/historical-fundamentals/:ticker", async (req, res) => {
      const { ticker } = req.params;
      try {
        const data = await NexusEngine.fetchHistoricalFundamentals(ticker);
        res.json(data);
      } catch (error) {
        console.error(`[API] ERROR /api/historical-fundamentals/${ticker}:`, error);
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/peers/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { type } = req.query;
      try {
        const result = await NexusEngine.fetchPeers(ticker, (type as any) || "ACAO");
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/peers/${ticker}:`, error);
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    // Removed duplicate download-engine route
    
    // Mock CRON Worker for Corporate Events
    app.post("/api/cron/sync-events", (_req, res) => {
      
      // In a real app, this would:
      // 1. Fetch splits/dividends from an external API (e.g., B3, Yahoo Finance)
      // 2. Insert them into the `corporate_events` table in Supabase
      // 3. Trigger a recalculation of `user_positions` for affected users
      
      const mockEvents = [
        { ticker: 'PETR4', type: 'DIVIDEND', value: 1.04, date: new Date().toISOString() },
        { ticker: 'MGLU3', type: 'SPLIT', factor: 4, date: new Date().toISOString() }
      ];

      res.json({ 
        status: 'success', 
        message: 'Corporate events synced successfully',
        events_processed: mockEvents.length,
        data: mockEvents
      });
    });

    // API 404 Handler
    app.all('/api/*', (req, res) => {
      console.warn(`[API] 404 Not Found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        error: 'NEXUS API 404', 
        path: req.originalUrl,
        method: req.method 
      });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: {
            port: 3001 // Use a different port for HMR to avoid conflict with main server
          }
        },
        appType: "spa",
      });
      app.use(vite.middlewares);

      // SPA Fallback for development
      app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        
        // Safety: Never serve HTML for API paths
        if (url.startsWith('/api/')) {
          return next();
        }

        try {
          let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          const indexPath = path.join(distPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send('Not Found');
          }
        });
      }
    }

    // Global Error Handler
    app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(`[SERVER ERROR] [${new Date().toISOString()}]`, err);
      
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: formatYahooError(err),
        path: req.path,
        details: process.env.NODE_ENV === 'development' ? err : undefined
      });
    });

    return { app, PORT };
  })();

  serverPromise.then(() => {
    // Server promise resolved successfully
  }).catch((err) => {
    console.error("[SERVER] Server promise failed:", err);
  });

  return serverPromise;
}

export default createServer;
