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

    this.updateStatus({ state: 'syncing', currentTask: 'Iniciando telemetria avançada...', progress: 0 });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[Nexus Brain] Usuário não logado. Sincronização em nuvem desativada.');
        this.updateStatus({ state: 'error', currentTask: 'Usuário não autenticado.', progress: 0 });
        return;
      }

      console.log(`[Nexus Brain] Iniciando matriz de processamento paralelo para ${portfolio.length} ativos...`);
      const totalItems = portfolio.length;
      let completed = 0;
      let totalInserted = 0;
      const anomalies: string[] = [];

      // 1. Puxa todo o cache de proventos do usuário em um única query para evitar sobrecarga no DB
      this.updateStatus({ currentTask: 'Mapeando espectro de custódia na nuvem...', progress: 5 });
      const { data: existingUserDivs, error: fetchError } = await supabase
        .from('dividends')
        .select('ticker, date')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const existingDivsMap = new Set(
        (existingUserDivs || []).map(d => `${d.ticker}-${d.date.split('T')[0]}`)
      );

      // 2. Busca de dados paralelizada em blocos controlados (Chunking / Concurrency Control)
      const CHUNK_SIZE = 4; // Ajustável de acordo com o limite de conexões
      const allNewDivsToInsert: any[] = [];

      for (let i = 0; i < portfolio.length; i += CHUNK_SIZE) {
        const chunk = portfolio.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(chunk.map(async (item) => {
          try {
            const divs = await financeService.getAssetDividends(item.ticker);
            
            if (divs && Array.isArray(divs) && divs.length > 0) {
              // Anomaly Analysis (Heurística)
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
                } else if (latest > avg * 1.5) {
                  anomalies.push(`${item.ticker}: Salto explosivo de dividendos detectado! (R$ ${latest.toFixed(2)})`);
                }
              }
              
              const formattedDivs = divs.map(d => {
                const dateVal = d.date || d.dataCom;
                return {
                  user_id: user.id,
                  ticker: item.ticker.toUpperCase(),
                  type: d.type || (item.ticker.toUpperCase().endsWith('11') ? 'Rendimento' : 'Dividendo'),
                  date: new Date(dateVal).toISOString(),
                  amount: typeof d.amount === 'string' ? parseFloat(d.amount) : d.amount,
                  is_future: new Date(d.paymentDate || dateVal) > new Date()
                };
              }).filter(d => d.date && !isNaN(d.amount) && d.amount > 0);

              // 3. Checagem em memória (O(1) lookups)
              for (const div of formattedDivs) {
                const datePart = div.date.split('T')[0];
                const key = `${div.ticker}-${datePart}`;
                
                if (!existingDivsMap.has(key)) {
                  allNewDivsToInsert.push(div);
                  existingDivsMap.add(key); // Evita duplicatas locais entre a mesma execução
                }
              }
            }
          } catch (err) {
            console.error(`[Nexus Brain] Erro no nó de processamento ${item.ticker}:`, err);
          } finally {
            completed++;
            this.updateStatus({ 
              currentTask: `Sintetizando ${item.ticker}...`, 
              progress: 10 + Math.floor((completed / totalItems) * 80) 
            });
          }
        }));
      }

      // 4. Batch Insert
      if (allNewDivsToInsert.length > 0) {
        this.updateStatus({ currentTask: 'Consolidando base de dados central...', progress: 95 });
        const { error: insertError } = await supabase.from('dividends').insert(allNewDivsToInsert);
        if (insertError) {
          console.error(`[Nexus Brain] Falha na compressão do Batch DB:`, insertError);
        } else {
          totalInserted = allNewDivsToInsert.length;
          console.log(`[Nexus Brain] Propulsão concluída. ${totalInserted} novos nós inseridos.`);
        }
      }

      this.updateStatus({ 
        state: 'complete', 
        currentTask: `Análise quântica concluída. ${totalInserted > 0 ? `+${totalInserted} registros adicionados.` : 'Tudo atualizado.'}${anomalies.length > 0 ? ` | ${anomalies.length} anomalias sistêmicas.` : ''}`, 
        progress: 100,
        lastInsight: anomalies.length > 0 ? `${anomalies[0]}` : 'Nenhuma anomalia crítica na malha.'
      });
      
      setTimeout(() => this.updateStatus({ state: 'idle', currentTask: '' }), 6000);

    } catch (error) {
      console.error('[Nexus Brain] Falha Crítica do Sistema Neural:', error);
      this.updateStatus({ state: 'error', currentTask: 'Desalinhamento no banco de dados.', progress: 0 });
    }
  }
}

export const nexusAgentService = new NexusDividendAgent();
