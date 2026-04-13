import { usePortfolio } from '../hooks/usePortfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function PortfolioSummary() {
  const { portfolio } = usePortfolio();
  
  const totalInvested = portfolio.reduce((acc, item) => acc + item.totalInvested, 0);
  const currentTotalValue = portfolio.reduce((acc, item) => acc + (item.currentValue || item.totalInvested), 0);
  const totalProfit = currentTotalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const allocationData = portfolio.reduce((acc: any[], item) => {
    const existing = acc.find(a => a.name === item.assetType);
    if (existing) {
      existing.value += item.currentValue || item.totalInvested;
    } else {
      acc.push({ name: item.assetType, value: item.currentValue || item.totalInvested });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Resumo da Carteira</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <p className="text-xs text-slate-400">Patrimônio Atual</p>
            <p className="text-lg font-bold text-white">R$ {currentTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <p className="text-xs text-slate-400">Lucro Total</p>
            <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {Math.abs(totalProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({totalProfitPercentage.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={allocationData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {allocationData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
