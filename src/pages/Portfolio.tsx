import { Briefcase, Loader2 } from 'lucide-react';
import { NexusAgentUI } from '../components/NexusAgentUI';
import { PageHeader } from '../components/ui/PageHeader';
import { usePortfolio } from '../hooks/usePortfolio';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { AssetList } from '../components/AssetList';

export default function Portfolio() {
  const { loading } = usePortfolio();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Carregando Terminal Nexus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Minha Carteira"
        description={<><span className="text-primary font-bold">Arquitetura</span> Estratégica.</>}
        icon={Briefcase}
      />

      <NexusAgentUI />
      
      <div className="space-y-8 mt-8">
        <PortfolioSummary />
        
        <div className="space-y-6">
          <div className="flex items-center gap-6 px-1 md:px-0">
            <div className="w-2 h-10 bg-primary rounded-full" />
            <h2 className="text-display-sm text-foreground uppercase tracking-tighter">Meus Ativos em Custódia</h2>
          </div>
          <AssetList />
        </div>
      </div>
    </div>
  );
}
