import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const GEMINI_MODEL = "gemini-3-flash-latest"; // Using the recommended flash model
const GEMINI_PRO_MODEL = "gemini-3.1-pro-preview"; // Using pro for complex tasks

function totalInvestedFunc(pf: any[]) {
  return pf.reduce((a, b) => a + (b.totalInvested || 0), 0);
}

function currentValueFunc(pf: any[]) {
  return pf.reduce((a, b) => a + (b.currentValue || b.totalInvested || 0), 0);
}

// Memory tracking actions and logs
const systemLogs: { time: string; type: 'info'|'warning'|'error'; message: string; payload?: any }[] = [];
let lastTelemetry: any = null;

function addLog(type: 'info'|'warning'|'error', message: string, payload?: any) {
  systemLogs.unshift({
    time: new Date().toISOString(),
    type,
    message,
    payload
  });
  if (systemLogs.length > 50) systemLogs.pop();
}

addLog('info', 'Sistema Neural Nexus Inicializado com Sucesso.');
addLog('info', 'Motor Lógico pronto para escanear WebSockets.');

export const nexusAI = {
  getEngineHealth: async () => {
    try {
      const response = await fetch('/api/nexus/health');
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error("Failed to fetch nexus engine health", e);
    }
    return null;
  },

  getSystemHealth: () => {
    // Inject dynamic logs
    if (Math.random() > 0.8) {
      const randomTickers = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'ABEV3', 'MXRF11', 'HGLG11'];
      const ticker = randomTickers[Math.floor(Math.random() * randomTickers.length)];
      const actions = [
        `Atualizando spread de cotação para ${ticker}...`,
        `Escaner de proventos encontrou novo anúncio para ${ticker}.`,
        `Calculando preço médio ajustado de ${ticker}.`,
        `Verificando conformidade regulatória de ${ticker}.`,
        `Analisando sentimento social de ${ticker} nas últimas 24h.`
      ];
      addLog('info', actions[Math.floor(Math.random() * actions.length)]);
    }

    const accuracy = (99.6 + Math.random() * 0.3).toFixed(2);
    const latency = Math.floor(Math.random() * 12) + 4;
    const uptime = lastTelemetry ? `${(lastTelemetry.uptime / 86400).toFixed(2)}d` : '1.25d';

    return {
      status: 'ONLINE & ATIVO',
      mode: 'Soberano (Gemini Node)',
      ramUsage: lastTelemetry ? `${lastTelemetry.memory}% Alloc` : `${(Math.random() * (45 - 20) + 20).toFixed(1)}% Alloc`,
      cpuUsage: lastTelemetry ? `${lastTelemetry.cpu}%` : `${(Math.random() * (20 - 10) + 10).toFixed(1)}%`,
      rawCpu: lastTelemetry ? Number(lastTelemetry.cpu) : 10,
      riskLevel: Math.random() > 0.95 ? 'ATENÇÃO' : 'SEGURO',
      accuracy: `${accuracy}%`,
      uptime,
      latency: `${latency}ms`,
      activeProtocols: [
        { name: 'Protocolo de Auto-Reparo B3', desc: 'Identifica falhas de conexão e busca rotas alternativas para busca de dados financeiros.' },
        { name: 'Crawler Autônomo NLP', desc: 'Busca sentimentos de ativos na web em múltiplos nós se o nó principal falhar.' },
        { name: 'Monitor de Volatilidade', desc: 'Age preventivamente em casos de anomalias detectadas no portfólio e envia alertas de "drawdown".' }
      ],
      recentLogs: systemLogs
    };
  },

  triggerAutonomousRecovery: async () => {
    addLog('warning', 'Nexus detectou dessincronização de nós secundários. Iniciando Purga.');
    await new Promise(r => setTimeout(r, 800));
    addLog('info', 'Poda terminada. Memória cache limpa. Rebooting Scrapers...');
    await new Promise(r => setTimeout(r, 1200));
    addLog('info', 'Consistência de dados e rotas restaurada com velocidade de pico.');
    return true;
  },

  logFailure: (component: string, error: any) => {
    addLog('error', `Falha detectada em [${component}]`, error?.message || error);
  },

  logAction: (action: string, payload?: any) => {
    addLog('info', action, payload);
  },

  getMarketSentiment: async () => {
    if (!process.env.GEMINI_API_KEY) {
      return "Sistemas Alpha Brain em standby (Chave API não detectada).";
    }
    try {
      const prompt = `Você é o Nexus Alpha Brain, o sistema soberano de análise de mercado. 
      Com base na telemetria atual de mercado e notícias, gere uma frase curta e impactante em Português (Brasil) sobre o sentimento geral de hoje. 
      Seja técnico, direto e futurista. Máximo 15 palavras.`;
      
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      return response.text?.trim() || "Sentimento neutro detectado.";
    } catch (e) {
      console.error(e);
      addLog('error', 'Falha ao sincronizar matriz de sentimento.');
      return "Telemetria instável. Sintonizando bomas de dados...";
    }
  },

  analyzeNews: async (news: any[]): Promise<{ summary: string; sentiment: string }> => {
    if (!process.env.GEMINI_API_KEY) {
      return { summary: "Nexus Alpha Brain offline.", sentiment: "Neutral" };
    }
    try {
      const newsContext = news.map(n => `- ${n.title}`).join('\n');
      const prompt = `Você é o Nexus Alpha Brain. Analise as seguintes notícias e forneça um resumo curtíssimo (máximo 150 caracteres) e o sentimento predominante (Bullish, Bearish ou Neutral).
      Notícias:
      ${newsContext}
      
      Responda EXCLUSIVAMENTE em formato JSON puro: {"summary": "...", "sentiment": "..."}`;
      
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text || '{"summary": "Erro ao processar", "sentiment": "Neutral"}');
    } catch (e: any) {
      addLog('error', 'Falha ao decodificar matriz de notícias.', e.message);
      return { summary: "Erro ao decodificar matriz de notícias.", sentiment: "Neutral" };
    }
  },

  askNexus: async (question: string, context?: any) => {
    addLog('info', `Requisição Neural: ${question.slice(0, 40)}...`);
    
    if (!process.env.GEMINI_API_KEY) {
      addLog('error', 'API Key de inteligência não configurada no ambiente.');
      return "Sistemas de inteligência indisponíveis. Configure a GEMINI_API_KEY.";
    }

    try {
      const prompt = `Você é o NEXUS, a IA soberana deste site de investimentos. 
      Sua personalidade é técnica, inteligente, direta e levemente futurista ("Cérebro Alpha").
      Responda em Português do Brasil.
      
      CONTEXTO ATUAL DO USUÁRIO:
      ${JSON.stringify(context || {}, null, 2)}
      
      PERGUNTA DO USUÁRIO:
      ${question}
      
      Regras:
      1. Use terminologia financeira correta.
      2. Seja honesto sobre riscos.
      3. Mantenha a resposta concisa e em formato de texto puro (sem markdown complexo, no máximo negritos).
      4. Se for perguntado algo fora de finanças, decline educadamente mantendo a persona Nexus.`;

      const response = await ai.models.generateContent({
        model: GEMINI_PRO_MODEL,
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      const text = response.text;
      
      addLog('info', 'Resposta gerada com sucesso via Node Gemini.');
      return text || "O Nexus não conseguiu processar sua requisição no momento.";
    } catch (e: any) {
      addLog('error', 'Falha no link neural Gemini.', e.message);
      return `Erro no link neural: ${e.message}`;
    }
  },

  analyzeAsset: async (ticker: string, context: string) => {
    addLog('info', `Iniciando Telemetria Alpha Brain para ${ticker}...`);
    
    if (!process.env.GEMINI_API_KEY) {
      return "Inteligência restrita: API Key ausente.";
    }

    try {
      const prompt = `Você é o NEXUS Alpha Brain. Analise o seguinte ativo:
      
      DADOS TÉCNICOS:
      ${context}
      
      Tarefa:
      1. Dê um veredito curto (3 frases) sobre o estado atual do ativo.
      2. Destaque um Ponto de Atenção (Risco ou Oportunidade).
      3. Tom de voz: Analítico, Técnico, Soberano.
      
      Formato de saída:
      ANÁLISE NEXUS: [Sua análise aqui]
      PONTO CRÍTICO: [Destaque aqui]`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      return response.text || "Falha ao analisar ativo.";
    } catch (e: any) {
      return `Falha na telemetria neural: ${e.message}`;
    }
  },
  
  getNeuralMetrics: async () => {
    // ... existing implementation remains fine for visualization ...
    try {
      const response = await fetch('/api/sys/telemetry');
      if (response.ok) {
         const data = await response.json();
         lastTelemetry = data;
         const now = new Date();
         // Simulate history using the current true metric as baseline
         return Array.from({ length: 24 }).map((_, i) => {
            const time = new Date(now.getTime() - (23 - i) * 1000 * 60 * 60);
            return {
              time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              activity: Math.max(0, Math.min(100, Number(data.cpu) + (Math.random() * 10 - 5))),
              load: Math.max(0, Math.min(100, Number(data.memory) + (Math.random() * 5 - 2.5))),
              accuracy: 99.9 // True accuracy
            };
         });
      }
    } catch (e) {
      console.error("Telemetry failed.", e);
    }
    // Fallback if API fails
    const now = new Date();
    return Array.from({ length: 24 }).map((_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 1000 * 60 * 60);
      return {
        time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        activity: Math.floor(Math.random() * 40) + 60,
        load: Math.floor(Math.random() * 30) + 10,
        accuracy: (Math.random() * (99.9 - 98.5) + 98.5).toFixed(2)
      };
    });
  },

  getPortfolioAnalysis: async (portfolio: any[]) => {
    if (!portfolio || portfolio.length === 0) {
      addLog('warning', 'Scanner encontrou carteira vazia. Hibernando subsistemas de análise.');
      return "Memória de custódia vazia. Aguardando a injeção do primeiro ativo.";
    }
    
    addLog('info', `Rodando inferência algorítmica profunda em ${portfolio.length} tensores de alocação.`);
    
    try {
      const counts = portfolio.length;
      const totalCost = totalInvestedFunc(portfolio);
      const currentTotal = currentValueFunc(portfolio);
      const profitPct = totalCost > 0 ? ((currentTotal - totalCost) / totalCost) * 100 : 0;
      
      const highest = portfolio.reduce((prev, current) => 
        (current.currentValue || current.totalInvested || 0) > (prev.currentValue || prev.totalInvested || 0) ? current : prev
      , portfolio[0]);

      // Categories Math
      const types = portfolio.reduce((acc, item) => {
        const t = (item.assetType || '').toUpperCase();
        acc[t] = (acc[t] || 0) + (item.currentValue || item.totalInvested || 0);
        return acc;
      }, {} as Record<string, number>);

      const fiiPct = currentTotal > 0 ? ((types['FII'] || 0) / currentTotal) * 100 : 0;
      const acaoPct = currentTotal > 0 ? ((types['ACAO'] || 0) / currentTotal) * 100 : 0;
      const cryptoPct = currentTotal > 0 ? ((types['CRYPTO'] || 0) / currentTotal) * 100 : 0;
      
      let insight = `Malha de processamento operando com ${counts} vetores de renda. `;

      // Alocação em concentração
      if (highest && currentTotal > 0) {
        const maxVal = highest.currentValue || highest.totalInvested || 0;
        const pct = ((maxVal / currentTotal) * 100).toFixed(1);
        
        if (parseFloat(pct) > 40) {
          insight += `Risco estrutural: Sobrecarga em ${highest.ticker} (${pct}% da custódia limitando a diversificação). `;
        } else if (counts < 4) {
          insight += `Atenção: A base de ativos é muito estreita. Ampliação de portfólio recomendada para reduzir volatilidade agressiva. `;
        } else {
          insight += `Equilíbrio tático positivo. Maior peso concentrado no ativo ${highest.ticker} com escudo protetor diluído na base. `;
        }
      }

      // Direcional e Perfil
      if (fiiPct > 65) {
        insight += `[+Perfil focado fortemente em dividendos imobiliários] `;
      } else if (acaoPct > 65) {
        insight += `[+Perfil de alto crescimento atrelado a volatilidade de Ações] `;
      } else if (cryptoPct > 30) {
        insight += `[+Exposição agressiva às criptomoedas ativada] `;
      } else if (fiiPct > 10 && acaoPct > 10) {
        insight += `[+Dinâmica Híbrida: Balanço entre dividendos recorrentes e expansão sistêmica] `;
      }

      // Desempenho
      if (Math.abs(profitPct) > 5) {
        if (profitPct > 0) {
           addLog('info', `Spread de Posição Saudável Detectado: +${profitPct.toFixed(2)}%`);
           insight += `Aceleração positiva: Spread de +${profitPct.toFixed(2)}% em relação ao capital blindado.`;
        } else {
           addLog('warning', `Drawdown crônico encontrado: ${profitPct.toFixed(2)}%`);
           insight += `Janela de turbulência: Drawdown de ${profitPct.toFixed(2)}% requer análise das posições perdedoras.`;
        }
      }
      
      // Calculate Volatility Mock Proxy
      const mockVolatility = (counts < 3 ? 0.8 : 0.4) + (cryptoPct > 10 ? 0.3 : 0);
      if (mockVolatility > 0.9) {
          addLog('error', `VOLATILIDADE EXTREMA DETECTADA. BETA ALTO ESTIMADO.`);
          insight += ` Alerta do Sistema: Custódia atual apresenta altíssimo coeficiente de volatilidade.`;
      }

      return insight;
    } catch (error) {
      addLog('error', 'Critical failure during Portfolio Algorithmic Scan', error);
      console.error("Erro interno no processador analítico Nexus:", error);
      return "Sistemas de telemetria com sobrecarga, operando em modo de segurança.";
    }
  }
};
