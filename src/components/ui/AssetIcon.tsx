import { getAssetMetadata } from '../../constants/assets';

interface AssetIconProps {
  assetType: string;
  ticker: string;
  className?: string;
}

export function AssetIcon({ assetType, ticker, className = "" }: AssetIconProps) {
  const metadata = getAssetMetadata(assetType);
  const Icon = metadata.icon;

  return (
    <div className={`w-12 h-12 bg-${metadata.color}-600/10 rounded-2xl flex items-center justify-center text-${metadata.color}-500 border border-${metadata.color}-500/20 group-hover:scale-110 transition-all duration-500 group-hover:border-${metadata.color}-500/40 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.15)] ${className}`}>
      <Icon size={24} />
    </div>
  );
}
