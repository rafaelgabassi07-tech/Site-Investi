import { getAssetMetadata } from '../../constants/assets';

interface AssetIconProps {
  assetType: string;
  ticker: string;
  className?: string;
}

export function AssetIcon({ assetType, ticker, className = "" }: AssetIconProps) {
  const metadata = getAssetMetadata(assetType);
  const Icon = metadata.icon;

  // Mapa de cores para Tailwind robusto sem interpolação de classes complexas
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/5 text-blue-600 border-blue-500/20',
    emerald: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20',
    indigo: 'bg-indigo-500/5 text-indigo-600 border-indigo-500/20',
    purple: 'bg-purple-500/5 text-purple-600 border-purple-500/20',
    cyan: 'bg-cyan-500/5 text-cyan-600 border-cyan-500/20',
    slate: 'bg-slate-500/5 text-slate-600 border-slate-500/20',
  };

  const styleClass = colorMap[metadata.color] || colorMap.blue;

  return (
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm transition-all duration-300 ${styleClass} ${className}`}>
      <Icon className="w-6 h-6" strokeWidth={2} />
    </div>
  );
}
