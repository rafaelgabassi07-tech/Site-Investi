import { 
  TrendingUp, 
  Building2, 
  Globe, 
  Landmark, 
  Layers 
} from 'lucide-react';

export const ASSET_TYPES = [
  { id: 'ACAO', label: 'Ação', icon: TrendingUp, color: 'blue' },
  { id: 'FII', label: 'FII', icon: Building2, color: 'emerald' },
  { id: 'ETF', label: 'ETF', icon: Layers, color: 'indigo' },
  { id: 'BDR', label: 'BDR', icon: Globe, color: 'purple' },
  { id: 'STOCK', label: 'Stock', icon: TrendingUp, color: 'cyan' },
  { id: 'RF', label: 'Renda Fixa', icon: Landmark, color: 'slate' },
] as const;

export type AssetTypeId = typeof ASSET_TYPES[number]['id'];

export const getAssetMetadata = (id: string) => {
  return ASSET_TYPES.find(a => a.id === id) || ASSET_TYPES[0];
};
