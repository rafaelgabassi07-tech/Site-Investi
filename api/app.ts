import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { NexusEngine, inferAssetType, formatYahooError, yahooFinance, ensureYahooConfig } from "../src/lib/nexus/engine.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nexus Native Heuristic Logic for Sentiment Analysis
function analyzeNexusSentiment(text: string) {
  const textualData = text.toLowerCase();
  const bullishWords = ['alta', 'lucro', 'crescimento', 'dividendos', 'recorde', 'compra', 'positivo', 'avança', 'supera', 'dispara', 'otimismo', 'salto', 'aprovado', 'bullish', 'gain'];
  const bearishWords = ['queda', 'prejuízo', 'crise', 'venda', 'negativo', 'recua', 'perde', 'despenca', 'rebaixado', 'risco', 'pessimismo', 'investigação', 'cai', 'bearish', 'loss'];
  
  let score = 50;
  bullishWords.forEach(w => { 
    const matches = textualData.split(w).length - 1;
    score += (matches * 10); 
  });
  
  bearishWords.forEach(w => { 
    const matches = textualData.split(w).length - 1;
    score -= (matches * 10);
  });
  
  score = Math.max(0, Math.min(100, score));
  
  let insight = "Mercado lateralizado. Volume informacional dentro da normalidade sistêmica.";
  if (score >= 65) {
    insight = "Forte momentum de alta detectado nos fluxos de dados do Nexus.";
  } else if (score <= 35) {
    insight = "Alerta de volatilidade negativa identificado nos vetores de mercado.";
  }
  
  return { score, insight };
}

let serverPromise: Promise<{ app: express.Express, PORT: number }> | null = null;

export async function createServer() {
  if (serverPromise) return serverPromise;

  serverPromise = (async () => {
    ensureYahooConfig();
    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());

    // Debug Logger
    app.use((req, res, next) => {
      if (req.url.startsWith("/api/")) {
        console.log(`[NEXUS SERVER] ${req.method} ${req.url}`);
      }
      next();
    });

    // API Routes
    app.get("/api/check-ver", (_req, res) => {
      res.json({ version: "v5-no-gemini", time: new Date().toISOString() });
    });

    app.get("/api/sys/telemetry", (_req, res) => {
      try {
        const load = os.loadavg();
        const cpuUsage = (load && load.length > 0) ? load[0] * 100 : 5; 
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memUsage = totalMem > 0 ? ((totalMem - freeMem) / totalMem) * 100 : 10;
        
        res.json({
          cpu: Math.min(cpuUsage, 100).toFixed(2),
          memory: Math.min(memUsage, 100).toFixed(2),
          uptime: os.uptime(),
          time: new Date().toISOString()
        });
      } catch (e) {
        res.json({ cpu: "12.50", memory: "35.20", uptime: 3600, time: new Date().toISOString() });
      }
    });

    app.get("/api/ai/sentiment", async (_req, res) => {
      try {
        // Use Nexus Native Logic instead of Gemini
        const news = await NexusEngine.fetchNews("IBOVESPA");
        const allText = news.map(n => n.title).join(" ");
        const { insight } = analyzeNexusSentiment(allText);
        res.json({ text: insight });
      } catch (e: any) {
        console.error("[API AI] Sentiment error:", e);
        res.status(500).json({ error: e.message });
      }
    });

    app.post("/api/ai/ask", async (req, res) => {
      const { question } = req.body;
      // Nexus AI Native Response (Deterministic/Pattern-based)
      const q = question.toLowerCase();
      let response = "O Nexus está processando sua solicitação técnica. No momento, o foco está na análise quantitativa de dados.";
      
      if (q.includes("ibovespa") || q.includes("mercado")) {
        response = "O IBOVESPA apresenta padrões de consolidação técnica nos níveis atuais.";
      } else if (q.includes("nexus")) {
        response = "Eu sou o Nexus AI, a inteligência nativa desenvolvida para processamento de ativos financeiros em tempo real.";
      }

      res.json({ text: response });
    });

    app.get("/api/quotes/batch", async (req, res) => {
      const { tickers } = req.query;
      if (!tickers || typeof tickers !== "string") {
        return res.status(400).json({ error: "Tickers parameter is required." });
      }
      const tickerList = tickers.split(",").map(t => t.trim().toUpperCase()).filter(t => t.length > 0);
      try {
        const querySyms = tickerList.map(t => (t.includes("^") || t.includes("=") || t.includes("-USD") || t.endsWith(".SA")) ? t : `${t}.SA`);
        const quotes = await yahooFinance.quote(querySyms, { return: "array" } as any);
        const results = tickerList.map((originalTicker, idx) => {
          const data = quotes.find((q: any) => q.symbol === querySyms[idx]);
          return {
            ticker: originalTicker,
            price: data?.regularMarketPrice || 0,
            currency: data?.currency || "BRL",
            change: data?.regularMarketChangePercent != null ? `${data.regularMarketChangePercent > 0 ? "+" : ""}${data.regularMarketChangePercent.toFixed(2)}%` : "0.00%",
            name: data?.longName || data?.shortName || originalTicker,
            type: inferAssetType(originalTicker)
          };
        });
        res.json(results);
      } catch (error: any) {
        console.error("Batch quote error:", error);
        res.status(500).json({ error: formatYahooError(error) });
      }
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
        const quotes = await yahooFinance.quote(tickers.map(t => t.sym), { return: "array" } as any);
        const results = tickers.map(({ sym, label }) => {
          const data = quotes.find((q: any) => q.symbol === sym);
          const change = data?.regularMarketChangePercent;
          return {
            ticker: sym,
            label,
            price: data?.regularMarketPrice?.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) || "---",
            change: change != null ? (change > 0 ? "+" : "") + change.toFixed(2) + "%" : "0.00%",
            color: change && change < 0 ? "red" : "emerald"
          };
        });
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch market stats" });
      }
    });

    app.get("/api/search-suggestions", async (req, res) => {
      const q = req.query.q as string;
      if (!q) return res.json([]);
      try {
        const result = await NexusEngine.searchSuggestions(q);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch suggestions" });
      }
    });

    app.get("/api/ranking", async (req, res) => {
      const { category, type } = req.query;
      try {
        const result = await NexusEngine.fetchRanking(category as string, type as any);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/news", async (req, res) => {
      const ticker = req.query.ticker as string;
      try {
        const result = await NexusEngine.fetchNews(ticker || "IBOVESPA");
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/asset/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const type = req.query.type as any || inferAssetType(ticker);
      try {
        const data = await NexusEngine.fetchAtivo(ticker, type);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/history/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { period } = req.query;
      try {
        const data = await NexusEngine.fetchHistoricoGrafico(ticker, (period as any) || "1M");
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/dividends/:ticker", async (req, res) => {
      const { ticker } = req.params;
      try {
        const data = await NexusEngine.fetchDividends(ticker);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/historical-fundamentals/:ticker", async (req, res) => {
      const { ticker } = req.params;
      try {
        const data = await NexusEngine.fetchHistoricalFundamentals(ticker);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/peers/:ticker", async (req, res) => {
      const { ticker } = req.params;
      const { type } = req.query;
      try {
        const data = await NexusEngine.fetchPeers(ticker, (type as any) || "Acao");
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/screener", async (req, res) => {
      try {
        const data = await NexusEngine.screener(req.query);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/search", async (req, res) => {
      const { q } = req.query;
      if (!q) return res.json([]);
      try {
        const data = await NexusEngine.searchTicker(q as string);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    app.get("/api/exchange-rate", async (req, res) => {
      try {
        const quotes = await yahooFinance.quote("USDBRL=X");
        res.json({ rate: quotes.regularMarketPrice || 5.0 });
      } catch (error) {
        res.status(500).json({ error: formatYahooError(error) });
      }
    });

    // SPA Fallback and 404
    app.all("/api/*", (req, res) => {
      res.status(404).json({ error: "NEXUS API 404", path: req.originalUrl });
    });

    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: { port: 3001 } },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.get("*", async (req, res, next) => {
        if (req.originalUrl.startsWith("/api/")) return next();
        try {
          let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
          template = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) { next(e); }
      });
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
    }

    return { app, PORT };
  })();

  return serverPromise;
}
export default createServer;
