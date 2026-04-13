export function parseFinanceValue(v: any): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.trim().replace('R$', '').replace('%', '').replace(/\s/g, '');
    if (cleaned === '---' || cleaned === 'N/A' || cleaned === '') return 0;
    
    // Check if it's Brazilian format (1.234,56) or US format (1,234.56)
    // If it has a comma and a dot, we need to be careful.
    // In BR format, the comma is the last separator.
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // BR Format: 1.234,56
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    } else if (lastDot > lastComma) {
      // US Format: 1,234.56
      return parseFloat(cleaned.replace(/,/g, '')) || 0;
    } else if (lastComma !== -1) {
      // Only comma: 12,34
      return parseFloat(cleaned.replace(',', '.')) || 0;
    }
    
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

export function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercentage(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
