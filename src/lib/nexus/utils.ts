export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const normalizeBRNumber = (val: string): string | null => {
  if (!val) return null;
  // Remove espaços, quebras de linha e caracteres invisíveis
  let clean = val.replace(/\s+/g, '').trim();
  
  // Se for porcentagem, mantém o % mas limpa o resto
  if (clean.includes('%')) {
    return clean;
  }

  // Se for valor monetário ou decimal brasileiro (1.234,56 ou 1234,56)
  // Primeiro remove pontos de milhar, depois troca vírgula por ponto
  if (clean.includes(',')) {
    return clean.replace(/\./g, '').replace(',', '.');
  }

  return clean;
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

export const getRandomAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
