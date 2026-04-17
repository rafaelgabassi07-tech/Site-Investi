import { PortfolioSummary } from '../components/PortfolioSummary';
import { PageHeader } from '../components/ui/PageHeader';
import { Briefcase } from 'lucide-react';
import { AssetList } from '../components/AssetList';

export default function PortfolioSummaryPage() {
  return (
    <div className="space-y-8 md:space-y-12">
      <div className="space-y-4">
        <PageHeader 
          title="Resumo da Carteira"
          description="Visão geral estratégica da sua alocação e desempenho."
          icon={Briefcase}
        />
        <PortfolioSummary />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6 px-1 md:px-4">
          <div className="w-2 h-10 bg-blue-600 rounded-full" />
          <h2 className="text-display-sm text-white uppercase italic tracking-tighter">Meus Ativos em Custódia</h2>
        </div>
        <AssetList />
      </div>
    </div>
  );
}
