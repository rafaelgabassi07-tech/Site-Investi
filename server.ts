import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import yahooFinance from "yahoo-finance2";
import { NexusEngineUltra } from "./src/lib/nexus/engine.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/asset/:ticker", async (req, res) => {
    const { ticker } = req.params;
    const { type } = req.query;
    try {
      const data = await NexusEngineUltra.fetchAtivo(ticker, (type as any) || 'ACAO');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/history/:ticker", async (req, res) => {
    const { ticker } = req.params;
    const { period } = req.query;
    try {
      const data = await NexusEngineUltra.fetchHistoricoGrafico(ticker, (period as any) || '1y');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/dividends/:ticker", async (req, res) => {
    const { ticker } = req.params;
    try {
      const data = await NexusEngineUltra.fetchDividends(ticker);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/search", async (req, res) => {
    const { q } = req.query;
    try {
      const result = await NexusEngineUltra.searchTicker(q as string);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/news", async (req, res) => {
    const { ticker } = req.query;
    try {
      const result = await NexusEngineUltra.fetchNews((ticker as string) || "IBOVESPA");
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/market-stats", async (req, res) => {
    const tickers = ["^BVSP", "^GSPC", "USDBRL=X", "BTC-USD"];
    try {
      const results = await Promise.all(tickers.map(t => NexusEngineUltra.fetchAtivo(t, 'ACAO')));
      const stats = results.map((r, idx) => ({
        label: idx === 0 ? 'IBOVESPA' : idx === 1 ? 'S&P 500' : idx === 2 ? 'DÓLAR' : 'BITCOIN',
        value: typeof r.results.precoAtual === 'number' ? r.results.precoAtual.toLocaleString('pt-BR') : r.results.precoAtual,
        change: r.results.variacaoDay || '0.00%',
        color: r.results.variacaoDay?.startsWith('-') ? 'red' : 'emerald'
      }));
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Alterado para custom para controle total
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
