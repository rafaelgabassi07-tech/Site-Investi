import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "../lib/supabase";
import { financeService } from "./financeService";

export interface DividendInsight {
  ticker: string;
  message: string;
  confidence: number;
  type: 'prediction' | 'warning' | 'info';
}

export interface AgentStatus {
  state: 'idle' | 'syncing' | 'analyzing' | 'complete' | 'error';
  currentTask: string;
  progress: number;
  lastInsight?: string;
}

type StatusCallback = (status: AgentStatus) => void;

class NexusDividendAgent {
  private status: AgentStatus = { state: 'idle', currentTask: '', progress: 0 };
  private callbacks: StatusCallback[] = [];
  private aiInstance: GoogleGenAI | null = null;

  private getAi() {
    if (!this.aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }
      this.aiInstance = new GoogleGenAI({ apiKey });
    }
    return this.aiInstance;
  }

  subscribe(callback: StatusCallback) {
    this.callbacks.push(callback);
    callback(this.status);
    return () => {
      this.callbacks = this.callbacks.filter(c => c !== callback);
    };
  }

  private updateStatus(newStatus: Partial<AgentStatus>) {
    this.status = { ...this.status, ...newStatus };
    this.callbacks.forEach(cb => cb(this.status));
  }

  async runSync(portfolio: any[]) {
    if (this.status.state === 'syncing' || this.status.state === 'analyzing') return;
    if (portfolio.length === 0) return;

    this.updateStatus({ state: 'syncing', currentTask: 'Iniciando busca no Investidor10...', progress: 0 });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const totalItems = portfolio.length;
      let completed = 0;

      for (const item of portfolio) {
        this.updateStatus({ 
          currentTask: `Buscando proventos de ${item.ticker}...`, 
          progress: Math.floor((completed / totalItems) * 100) 
        });

        try {
          // 1. Fetch from Investidor10 via Backend Scraper
          const divs = await financeService.getAssetDividends(item.ticker);
          
          if (divs && Array.isArray(divs)) {
            const formattedDivs = divs.map(d => ({
              user_id: user.id,
              ticker: item.ticker.toUpperCase(),
              type: item.assetType || (item.ticker.toUpperCase().endsWith('11') ? 'FII' : 'ACAO'),
              date: d.dataCom || d.date,
              paymentDate: d.paymentDate || d.date,
              amount: typeof d.amount === 'string' ? parseFloat(d.amount) : d.amount,
              is_future: new Date(d.paymentDate || d.date) > new Date()
            })).filter(d => d.date && d.amount > 0);

            // 2. Save to Supabase (Avoiding duplicates)
            for (const div of formattedDivs) {
              const { data: existing } = await supabase.from('dividends')
                .select('id')
                .match({ user_id: user.id, ticker: div.ticker, date: div.date })
                .limit(1);
              
              if (!existing || existing.length === 0) {
                await supabase.from('dividends').insert(div);
              }
            }

            // 3. AI Analysis if we have enough history
            if (formattedDivs.length > 3) {
              this.updateStatus({ state: 'analyzing', lastInsight: `Analisando padrões de ${item.ticker}...` });
              await this.generateAiInsights(item.ticker, formattedDivs, user.id);
            }
          }
        } catch (err) {
          console.error(`[Robot Agent] Erro em ${item.ticker}:`, err);
        }

        completed++;
      }

      this.updateStatus({ state: 'complete', currentTask: 'Sincronização finalizada com sucesso!', progress: 100 });
      
      // Auto-reset after a few seconds
      setTimeout(() => this.updateStatus({ state: 'idle', currentTask: '' }), 5000);

    } catch (error) {
      console.error('[Robot Agent] Erro crítico:', error);
      this.updateStatus({ state: 'error', currentTask: 'Falha na operação do robô.', progress: 0 });
    }
  }

  private async generateAiInsights(ticker: string, history: any[], userId: string) {
    try {
      // Limit history to last 2 years for analysis
      const recentHistory = history
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 15);

      const historySummary = recentHistory.map(h => `${h.date}: R$${h.amount} (${h.type})`).join('\n');
      
      const prompt = `Analise o histórico de dividendos de ${ticker} e identifique a sazonalidade. 
      Com base nessas datas:
      ${historySummary}
      
      Qual é o provável próximo mês de pagamento? Existe algum padrão de crescimento? 
      Responda em PORTUGUÊS um JSON curto: {"message": "string de 1 frase", "nextMonth": string, "pattern": "string"}.`;

      const ai = this.getAi();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              nextMonth: { type: Type.STRING },
              pattern: { type: Type.STRING }
            },
            required: ["message"]
          }
        }
      });

      const insight = JSON.parse(response.text);
      this.updateStatus({ lastInsight: `${ticker}: ${insight.message}` });

      // If AI predicts a next month that we don't have recorded, add a "placeholder" prediction
      if (insight.nextMonth) {
        // Logic for adding a future placeholder could go here if needed
      }

    } catch (e) {
      console.warn(`[Robot Agent] AI Analysis failed for ${ticker}`, e);
    }
  }
}

export const nexusAgentService = new NexusDividendAgent();
