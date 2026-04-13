import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { NexusEngine } from "../src/lib/nexus/engine.js";

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
    app.get("/api/asset/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { type } = req.query;
      console.log(`[API] Fetching asset: ${ticker}, type=${type}`);
      try {
        const data = await NexusEngine.fetchAtivo(ticker, (type as any) || 'ACAO');
        res.json(data);
      } catch (error) {
        console.error(`[API] Error fetching asset ${ticker}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/history/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { period } = req.query;
      console.log(`[API] Fetching history: ${ticker}, period=${period}`);
      try {
        const data = await NexusEngine.fetchHistoricoGrafico(ticker, (period as any) || '1y');
        res.json(data);
      } catch (error) {
        console.error(`[API] Error fetching history ${ticker}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/dividends/:ticker", async (req, res) => {
      const { ticker } = req.params;
      try {
        const data = await NexusEngine.fetchDividends(ticker);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/search", async (req, res) => {
      const { q } = req.query;
      console.log(`[API] Searching: ${q}`);
      try {
        const result = await NexusEngine.searchTicker(q as string);
        res.json(result);
      } catch (error) {
        console.error(`[API] Error searching ${q}:`, error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/news", async (req, res) => {
      const { ticker } = req.query;
      try {
        const result = await NexusEngine.fetchNews((ticker as string) || "IBOVESPA");
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    app.get("/api/ranking", async (req, res) => {
      const { category, type } = req.query;
      console.log(`[API] Fetching ranking: category=${category}, type=${type}`);
      try {
        const result = await NexusEngine.fetchRanking((category as string) || "Dividend Yield", (type as any) || "ACAO");
        res.json(result);
      } catch (error) {
        console.error(`[API] Error fetching ranking:`, error);
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
      const tickers = ["^BVSP", "^GSPC", "USDBRL=X", "BTC-USD"];
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
          
          return {
            ticker: tickers[idx],
            label: idx === 0 ? 'IBOVESPA' : idx === 1 ? 'S&P 500' : idx === 2 ? 'DÓLAR' : 'BITCOIN',
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

    return { app, PORT };
  })();

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
