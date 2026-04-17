import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { NexusEngine, inferAssetType } from "../src/lib/nexus/engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverPromise: Promise<{ app: express.Express, PORT: number }> | null = null;

export async function createServer() {
  if (serverPromise) return serverPromise;

  serverPromise = (async () => {
    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());

    // API Routes
    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok", time: new Date().toISOString() });
    });

    app.get("/api/search", async (req, res) => {
      const { q } = req.query;
      try {
        const result = await NexusEngine.searchTicker(q as string);
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/search q=${q}:`, error);
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/ranking", async (req, res) => {
      const { category, type } = req.query;
      try {
        const result = await NexusEngine.fetchRanking((category as string) || "Dividend Yield", (type as any) || "ACAO");
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/ranking:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/market-stats", async (_req, res) => {
      const tickers = ["^BVSP", "^GSPC", "USDBRL=X", "BTC-USD", "IFIX.SA"];
      try {
        const results = await Promise.all(tickers.map(async (t) => {
          try {
            const data = await NexusEngine.fetchAtivo(t, 'ACAO');
            return data;
          } catch (e) {
            console.error(`[API] Error fetching market stat for ${t}:`, e);
            return { ticker: t, results: { precoAtual: 0, variacaoDay: '0.00%' }, cacheStatus: 'ERROR' };
          }
        }));

        const stats = results.map((r: any, idx: number) => {
          const preco = r.results?.precoAtual;
          const variacao = r.results?.variacaoDay || '0.00%';
          
          let label = '';
          if (idx === 0) label = 'IBOVESPA';
          else if (idx === 1) label = 'S&P 500';
          else if (idx === 2) label = 'DÓLAR';
          else if (idx === 3) label = 'BITCOIN';
          else if (idx === 4) label = 'IFIX';

          return {
            ticker: tickers[idx],
            label,
            price: typeof preco === 'number' && preco > 0 ? preco.toLocaleString('pt-BR') : (preco || '---'),
            value: typeof preco === 'number' && preco > 0 ? preco.toLocaleString('pt-BR') : (preco || '---'),
            change: variacao,
            color: variacao.startsWith('-') ? 'red' : 'emerald'
          };
        });
        res.json(stats);
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
          details: error instanceof Error ? error.message : String(error) 
        });
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
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/dividends/:ticker", async (req, res) => {
      const { ticker } = req.params;
      try {
        const data = await NexusEngine.fetchDividends(ticker);
        res.json(data);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/dividends/${ticker}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/historical-fundamentals/:ticker", async (req, res) => {
      const { ticker } = req.params;
      try {
        const data = await NexusEngine.fetchHistoricalFundamentals(ticker);
        res.json(data);
      } catch (error) {
        console.error(`[API] ERROR /api/historical-fundamentals/${ticker}:`, error);
        res.status(500).json({ error: (error as Error).message });
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
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/download-engine", (_req, res) => {
      try {
        const filePath = path.resolve(__dirname, '../src/lib/nexus/engine.ts');
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'text/typescript');
          res.setHeader('Content-Disposition', 'attachment; filename=nexus-engine-scraper.ts');
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        } else {
          res.status(404).json({ error: "Arquivo do motor não encontrado." });
        }
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

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
    app.use('/api/*', (req, res) => {
      res.status(404).json({ 
        error: 'API Route Not Found', 
        path: req.originalUrl,
        method: req.method 
      });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
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
      
      let errorMessage = err.message;
      let errorDetails = err;

      // Try to parse JSON error messages or handle objects with 'errors' property
      try {
        if (err.errors && Array.isArray(err.errors)) {
          errorMessage = err.errors.map((e: any) => e.message || e.description || JSON.stringify(e)).join(', ');
        } else if (typeof errorMessage === 'string' && (errorMessage.startsWith('{') || errorMessage.startsWith('['))) {
          const parsed = JSON.parse(errorMessage);
          if (Array.isArray(parsed)) {
            errorMessage = parsed.map((e: any) => e.message || e.description || JSON.stringify(e)).join(', ');
          } else if (parsed.errors && Array.isArray(parsed.errors)) {
            errorMessage = parsed.errors.map((e: any) => e.message || e.description || JSON.stringify(e)).join(', ');
          } else if (parsed.message) {
            errorMessage = parsed.message;
          }
        }
      } catch (e) {
        // Fallback to original message
      }

      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: errorMessage,
        path: req.path,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
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

if (!process.env.VERCEL) {
  createServer().then(({ app, PORT }) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default createServer;
