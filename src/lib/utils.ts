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

export function formatPercentString(v: number, digits: number = 2): string {
   if (isNaN(v)) return '0,00%';
   return v.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) + '%';
}

export function formatNumber(v: number, optionsOrMinDigits: number | Intl.NumberFormatOptions = 2, maxDigits?: number): string {
  if (v === undefined || v === null || isNaN(v)) return '0,00';
  
  if (typeof optionsOrMinDigits === 'object' && optionsOrMinDigits !== null) {
    const opts = { ...optionsOrMinDigits };
    if (opts.style === 'currency' && !opts.currency) {
      opts.currency = 'BRL';
    }
    
    // Safety check for fraction digits in options
    if (opts.minimumFractionDigits !== undefined && (isNaN(opts.minimumFractionDigits) || opts.minimumFractionDigits < 0 || opts.minimumFractionDigits > 20)) {
      opts.minimumFractionDigits = 2;
    }
    if (opts.maximumFractionDigits !== undefined && (isNaN(opts.maximumFractionDigits) || opts.maximumFractionDigits < 0 || opts.maximumFractionDigits > 20)) {
      opts.maximumFractionDigits = Math.max(opts.minimumFractionDigits || 0, 2);
    }
    
    try {
      return v.toLocaleString('pt-BR', opts);
    } catch (e) {
      console.warn('formatNumber failed with options:', opts, e);
      return v.toLocaleString('pt-BR');
    }
  }
  
  // Strict safety for numeric arguments
  let min = typeof optionsOrMinDigits === 'number' ? optionsOrMinDigits : 2;
  if (isNaN(min) || min < 0 || min > 20) min = 2;
  
  let max = typeof maxDigits === 'number' ? maxDigits : min;
  if (isNaN(max) || max < 0 || max > 20) max = Math.max(min, 2);

  try {
    return v.toLocaleString('pt-BR', {
      minimumFractionDigits: min,
      maximumFractionDigits: Math.max(min, max),
    });
  } catch (e) {
    return v.toLocaleString('pt-BR');
  }
}

export function formatCompactNumber(v: number | string): string {
  const num = typeof v === 'string' ? parseFinanceValue(v) : v;
  if (!num || isNaN(num)) return 'N/A';
  
  if (num >= 1_000_000_000_000) {
    return (num / 1_000_000_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' T';
  }
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' Bi';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' Mi';
  }
  if (num >= 1_000) {
    return (num / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' K';
  }
  return num.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
