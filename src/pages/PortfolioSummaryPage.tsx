import { PortfolioSummary } from '../components/PortfolioSummary';
import { PageHeader } from '../components/ui/PageHeader';
import { Briefcase } from 'lucide-react';
import { PortfolioNav } from '../components/PortfolioNav';

export default function PortfolioSummaryPage() {
  return (
    <div className="space-y-4">
      <PageHeader 
        title="Resumo da Carteira"
        description="Visão geral estratégica da sua alocação e desempenho."
        icon={Briefcase}
      />
      <PortfolioSummary />
    </div>
  );
}
