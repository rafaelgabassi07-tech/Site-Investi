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

    this.updateStatus({ state: 'syncing', currentTask: 'Iniciando busca sincronizada...', progress: 0 });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[Robot Agent] Usuário não logado. Sincronização em nuvem desativada.');
        this.updateStatus({ state: 'error', currentTask: 'Usuário não autenticado.', progress: 0 });
        return;
      }

      console.log(`[Robot Agent] Iniciando varredura para ${portfolio.length} ativos...`);
      const totalItems = portfolio.length;
      let completed = 0;
      let totalFound = 0;
      const anomalies: string[] = [];

      for (const item of portfolio) {
        this.updateStatus({ 
          currentTask: `Sincronizando ${item.ticker}...`, 
          progress: Math.floor((completed / totalItems) * 100) 
        });

        try {
          // 1. Fetch from Multiple Sources via Nexus Engine
          const divs = await financeService.getAssetDividends(item.ticker);
          
          if (divs && Array.isArray(divs) && divs.length > 0) {
            console.log(`[Robot Agent] ${item.ticker}: Encontrados ${divs.length} proventos.`);
            totalFound += divs.length;

            // Anomaly Check Logic
            const lastYearDivs = divs.filter(d => {
              const dDate = new Date(d.date || d.dataCom);
              return dDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            });

            if (lastYearDivs.length > 2) {
              const amounts = lastYearDivs.map(d => typeof d.amount === 'string' ? parseFloat(d.amount) : d.amount);
              const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
              const latest = amounts[0];
              
              if (latest < avg * 0.4) {
                anomalies.push(`${item.ticker}: Queda severa identificada (R$ ${latest.toFixed(2)} vs méd. R$ ${avg.toFixed(2)})`);
              }
            }
            
            const formattedDivs = divs.map(d => ({
              user_id: user.id,
              ticker: item.ticker.toUpperCase(),
              type: d.type || (item.ticker.toUpperCase().endsWith('11') ? 'Rendimento' : 'Dividendo'),
              date: d.date || d.dataCom,
              amount: typeof d.amount === 'string' ? parseFloat(d.amount) : d.amount,
              is_future: new Date(d.paymentDate || d.date) > new Date()
            })).filter(d => d.date && !isNaN(d.amount) && d.amount > 0);

            // 2. Save to Supabase
            for (const div of formattedDivs) {
              const divDate = new Date(div.date);
              const startOfDay = new Date(divDate);
              startOfDay.setUTCHours(0,0,0,0);
              const endOfDay = new Date(divDate);
              endOfDay.setUTCHours(23,59,59,999);

              const { data: existing, error: checkError } = await supabase.from('dividends')
                .select('id')
                .eq('user_id', user.id)
                .eq('ticker', div.ticker)
                .gte('date', startOfDay.toISOString())
                .lte('date', endOfDay.toISOString())
                .limit(1);
              
              if (checkError) {
                console.error(`[Robot Agent] Falha ao verificar existência (${div.ticker}):`, checkError);
                continue;
              }

              if (!existing || existing.length === 0) {
                const { error: insertError } = await supabase.from('dividends').insert(div);
                if (insertError) {
                  console.error(`[Robot Agent] Falha ao inserir:`, insertError);
                } else {
                  console.log(`[Robot Agent] Novo registro: ${div.ticker} - R$ ${div.amount}`);
                }
              }
            }
          } else {
            console.log(`[Robot Agent] ${item.ticker}: Nenhum provento recente encontrado.`);
          }
        } catch (err) {
          console.error(`[Robot Agent] Erro ao processar ${item.ticker}:`, err);
        }

        completed++;
      }

      this.updateStatus({ 
        state: 'complete', 
        currentTask: `Sincronização concluída! ${totalFound} registros processados.${anomalies.length > 0 ? ` [!] Detectadas ${anomalies.length} anomalias.` : ''}`, 
        progress: 100,
        lastInsight: anomalies.length > 0 ? `Alerta: ${anomalies[0]}${anomalies.length > 1 ? ` (+${anomalies.length - 1})` : ''}` : undefined
      });
      
      // Auto-reset after a few seconds
      setTimeout(() => this.updateStatus({ state: 'idle', currentTask: '' }), 5000);

    } catch (error) {
      console.error('[Robot Agent] Erro crítico:', error);
      this.updateStatus({ state: 'error', currentTask: 'Falha na operação do robô.', progress: 0 });
    }
  }
}

export const nexusAgentService = new NexusDividendAgent();
