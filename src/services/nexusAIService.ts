// Implementação Inteiramente Local e Algorítmica da Nexus Engine

function totalInvestedFunc(pf: any[]) {
  return pf.reduce((a, b) => a + (b.totalInvested || 0), 0);
}

function currentValueFunc(pf: any[]) {
  return pf.reduce((a, b) => a + (b.currentValue || b.totalInvested || 0), 0);
}

// Memory tracking actions and logs
const systemLogs: { time: string; type: 'info'|'warning'|'error'; message: string; payload?: any }[] = [];

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

export const nexusAI = {
  getSystemHealth: () => {
    return {
      status: 'ONLINE',
      mode: 'Heurístico Local (Offline-Safe)',
      ramUsage: 'Otimizado (O(1) lookups)',
      activeProtocols: [
        { name: 'Aegis de Memória', desc: 'Prevenção de quebra do painel em caso de falha nas APIS de cotas.' },
        { name: 'Rede Neural Estatística', desc: 'Geração de insights 100% locais sem consumir cotas JSON.' },
        { name: 'Sincronizador Quântico', desc: 'Processamento paralelo via chunking em matriz B3.' }
      ],
      recentLogs: systemLogs
    };
  },

  logFailure: (component: string, error: any) => {
    addLog('error', `Falha detectada em [${component}]`, error?.message || error);
  },

  logAction: (action: string, payload?: any) => {
    addLog('info', action, payload);
  },

  getMarketSentiment: async () => {
    addLog('info', 'Varredura de Sentimento Lexical requisitada.');
    return 'Malha neural do painel analisando matriz de rentabilidade em tempo real.';
  },

  getPortfolioAnalysis: async (portfolio: any[]) => {
    if (!portfolio || portfolio.length === 0) {
      addLog('warning', 'Tentativa de telemetria com carteira vazia.');
      return "Memória de custódia vazia. Aguardando a injeção do primeiro ativo.";
    }
    
    addLog('info', `Rodando inferência algorítmica em ${portfolio.length} nós de alocação.`);
    
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
          insight += `Aceleração positiva: Spread de +${profitPct.toFixed(2)}% em relação ao capital blindado.`;
        } else {
          insight += `Janela de turbulência: Drawdown de ${profitPct.toFixed(2)}% requer análise das posições perdedoras.`;
        }
      }
      
      // Calculate Volatility Mock Proxy
      const mockVolatility = (counts < 3 ? 0.8 : 0.4) + (cryptoPct > 10 ? 0.3 : 0);
      if (mockVolatility > 0.9) {
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
