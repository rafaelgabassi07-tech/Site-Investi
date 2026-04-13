import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { NexusEngine, inferAssetType } from "../src/lib/nexus/engine.ts";

console.log("[SERVER] Starting initialization...");
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

    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok", time: new Date().toISOString() });
    });

    // API Routes
    app.get("/api/asset/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { type } = req.query;
      const resolvedType = type ? (type as any) : inferAssetType(ticker);
      console.log(`[API] [${new Date().toISOString()}] GET /api/asset/${ticker} type=${resolvedType}`);
      try {
        const data = await NexusEngine.fetchAtivo(ticker, resolvedType);
        console.log(`[API] [${new Date().toISOString()}] SUCCESS /api/asset/${ticker}`);
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
      console.log(`[API] [${new Date().toISOString()}] GET /api/history/${ticker} period=${period}`);
      try {
        const data = await NexusEngine.fetchHistoricoGrafico(ticker, (period as any) || '1y');
        console.log(`[API] [${new Date().toISOString()}] SUCCESS /api/history/${ticker}`);
        res.json(data);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/history/${ticker}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/dividends/:ticker", async (req, res) => {
      const { ticker } = req.params;
      console.log(`[API] [${new Date().toISOString()}] GET /api/dividends/${ticker}`);
      try {
        const data = await NexusEngine.fetchDividends(ticker);
        console.log(`[API] [${new Date().toISOString()}] SUCCESS /api/dividends/${ticker}`);
        res.json(data);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/dividends/${ticker}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/search", async (req, res) => {
      const { q } = req.query;
      console.log(`[API] [${new Date().toISOString()}] GET /api/search q=${q}`);
      try {
        const result = await NexusEngine.searchTicker(q as string);
        console.log(`[API] [${new Date().toISOString()}] SUCCESS /api/search q=${q} results=${result.length}`);
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/search q=${q}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/news", async (req, res) => {
      const { ticker } = req.query;
      console.log(`[API] [${new Date().toISOString()}] GET /api/news ticker=${ticker}`);
      try {
        const result = await NexusEngine.fetchNews((ticker as string) || "IBOVESPA");
        console.log(`[API] [${new Date().toISOString()}] SUCCESS /api/news ticker=${ticker}`);
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/news ticker=${ticker}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/search-suggestions", async (req, res) => {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      try {
        // Use NexusEngine to fetch suggestions
        const result = await NexusEngine.searchSuggestions(q);
        res.json(result);
      } catch (error) {
        console.error(`[API] Error fetching search suggestions for ${q}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/ranking", async (req, res) => {
      const { category, type } = req.query;
      console.log(`[API] [${new Date().toISOString()}] GET /api/ranking category=${category}, type=${type}`);
      try {
        const result = await NexusEngine.fetchRanking((category as string) || "Dividend Yield", (type as any) || "ACAO");
        console.log(`[API] [${new Date().toISOString()}] SUCCESS /api/ranking category=${category} results=${result.length}`);
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/ranking:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });
    
    app.get("/api/peers/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { type } = req.query;
      console.log(`[API] [${new Date().toISOString()}] GET /api/peers/${ticker} type=${type}`);
      try {
        const result = await NexusEngine.fetchPeers(ticker, (type as any) || "ACAO");
        console.log(`[API] [${new Date().toISOString()}] SUCCESS /api/peers/${ticker}`);
        res.json(result);
      } catch (error) {
        console.error(`[API] [${new Date().toISOString()}] ERROR /api/peers/${ticker}:`, error);
        res.status(500).json({ error: (error as Error).message });
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

    app.get("/api/market-stats", async (_req, res) => {
      const tickers = ["^BVSP", "^GSPC", "USDBRL=X", "BTC-USD", "IFIX.SA"];
      console.log(`[API] Fetching market stats for: ${tickers.join(', ')}`);
      try {
        const results = await Promise.all(tickers.map(async (t) => {
          try {
            return await NexusEngine.fetchAtivo(t, 'ACAO');
          } catch (e) {
            console.error(`[API] Error fetching market stat for ${t}:`, e);
            return { ticker: t, results: {}, cacheStatus: 'ERROR' };
          }
        }));

        const stats = results.map((r: any, idx) => {
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
            price: typeof preco === 'number' ? preco.toLocaleString('pt-BR') : (preco || '---'),
            value: typeof preco === 'number' ? preco.toLocaleString('pt-BR') : (preco || '---'),
            change: variacao,
            color: variacao.startsWith('-') ? 'red' : 'emerald'
          };
        });
        res.json(stats);
      } catch (error) {
        console.error(`[API] Critical error in market-stats:`, error);
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
      console.log('[WORKER] Syncing corporate events from B3...');
      
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

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "custom",
      });
      app.use(vite.middlewares);

      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
          let template = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } else {
      // In production (including Vercel), we serve static files from 'dist'
      // Note: On Vercel, the static files are usually served by Vercel's edge, 
      // but this fallback is useful for other environments or if the rewrite fails.
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
        message: err.message,
        path: req.path
      });
    });

    return { app, PORT };
  })();

  serverPromise.then(() => {
    console.log("[SERVER] Server promise resolved successfully");
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
