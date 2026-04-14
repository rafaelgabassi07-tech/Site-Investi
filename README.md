# 🚀 Nexus Invest

> A evolução da sua plataforma de análise e gestão de investimentos.

O **Nexus Invest** é uma plataforma completa e moderna para investidores que buscam controle total sobre sua carteira, análises fundamentalistas profundas e inteligência de mercado em tempo real. Desenvolvido para superar as limitações de plataformas tradicionais, o Nexus combina uma interface premium (Dark Mode nativo) com Inteligência Artificial para entregar insights acionáveis.

---

## 🌟 Por que o Nexus Invest supera o Investidor10?

Enquanto plataformas como o Investidor10 oferecem bons dados fundamentalistas, o Nexus Invest foi desenhado para ser **mais rápido, mais inteligente e focado na experiência do usuário (UX)**. 

Aqui estão os nossos principais diferenciais:

1. **Inteligência Artificial Integrada (Gemini):** O Nexus não apenas lista notícias, ele lê, interpreta e gera uma **análise de sentimento (Bullish, Bearish, Neutral)** em tempo real usando a API do Google Gemini, poupando o tempo do investidor.
2. **Importação Nativa da B3:** Esqueça o lançamento manual. O Nexus permite importar planilhas diretamente da área logada da B3 (Excel/CSV), mapeando automaticamente códigos, quantidades e preços.
3. **Privacidade e Controle (Local-First + Cloud):** Seus dados de transação podem ser salvos localmente no seu navegador (`localStorage`) para máxima privacidade, ou sincronizados na nuvem via Supabase.
4. **Ecossistema All-in-One:** Em vez de usar um site para ver fundamentos, uma planilha para rebalanceamento e outro app para IR, o Nexus unifica tudo:
   - **Isentômetro (IR):** Controle automático do limite de R$ 20.000 para isenção de imposto em ações.
   - **Rebalanceamento Inteligente:** Defina o percentual ideal da sua carteira e o Nexus calcula exatamente o que você precisa comprar ou vender.
   - **Calculadoras Avançadas:** Juros Compostos, Preço Teto (Bazin), Preço Justo (Graham) e Independência Financeira (FIRE) integradas.
5. **Design Premium e Fluido:** Construído com `motion/react` e Tailwind CSS, oferecendo transições suaves, ausência de poluição visual (sem anúncios intrusivos) e foco total nos dados que importam.

---

## 🛠️ Funcionalidades Principais

### 📊 Gestão de Carteira
* **Dashboard Interativo:** Visão geral do patrimônio, rentabilidade e alocação por classe de ativo.
* **Rentabilidade Real:** Cálculo de rentabilidade utilizando o sistema de cotas (Time-Weighted Return - TWR), comparando diretamente com o IBOVESPA.
* **Transações:** Registro de compras e vendas com cálculo automático de preço médio.
* **Proventos (Dividendos):** Agenda de pagamentos futuros, histórico de recebimentos e cálculo de *Yield on Cost* (YOC).

### 🔍 Análise de Mercado
* **Screener Avançado:** Filtre ações e FIIs por P/L, P/VP, Dividend Yield, ROE, Margem Líquida, entre outros.
* **Rankings Nexus:** Descubra as melhores oportunidades baseadas em metodologias consagradas (Graham, Décio Bazin, Maiores Pagadoras de Dividendos).
* **Comparador de Ativos:** Coloque duas ações lado a lado e compare seus múltiplos fundamentalistas.
* **Página de Ativo Detalhada:** Cotação em tempo real, gráficos interativos, indicadores fundamentalistas e empresas pares.

### 🧠 Inteligência e Ferramentas
* **Market Intelligence (Notícias):** Feed de notícias filtrável com análise de sentimento gerada por IA.
* **Renda Fixa:** Simulador de investimentos comparando Tesouro Direto, CDBs, LCIs/LCAs com a Poupança.
* **Tributação:** Resumo fiscal e controle de isenção de vendas.
* **Carteiras Recomendadas:** Modelos de portfólio para diferentes perfis (Conservador, Arrojado, Focados em Dividendos).

---

## 💻 Stack Tecnológico

O Nexus Invest foi construído com tecnologias de ponta para garantir performance e escalabilidade:

* **Frontend:** React 18, TypeScript, Vite
* **Estilização:** Tailwind CSS, `lucide-react` (Ícones)
* **Animações:** `motion/react`
* **Gráficos:** `recharts`
* **Backend/API:** Express.js (Node.js) para proxy de dados financeiros
* **Inteligência Artificial:** `@google/genai` (Gemini 1.5 Flash)
* **Banco de Dados / Auth:** Supabase
* **Processamento de Dados:** `xlsx` (para leitura de planilhas da B3), `date-fns`

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js (v18 ou superior)
* NPM ou Yarn
* Chave de API do Supabase (opcional para persistência em nuvem)
* Chave de API do Google Gemini (para análise de notícias)

### Passo a Passo

1. **Clone o repositório:**
   \`\`\`bash
   git clone https://github.com/seu-usuario/nexus-invest.git
   cd nexus-invest
   \`\`\`

2. **Instale as dependências:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto e adicione:
   \`\`\`env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   GEMINI_API_KEY=sua_chave_do_google_gemini
   \`\`\`

4. **Inicie o servidor de desenvolvimento:**
   \`\`\`bash
   npm run dev
   \`\`\`
   *O aplicativo estará disponível em `http://localhost:3000`.*

---

## 📂 Estrutura do Projeto

* `/src/pages/`: Contém todas as telas da aplicação (Dashboard, Portfolio, Screener, etc.).
* `/src/components/`: Componentes de UI reutilizáveis (Botões, Cards, Gráficos, Layout).
* `/src/contexts/`: Gerenciamento de estado global (ex: `PortfolioProvider.tsx`).
* `/src/services/`: Integração com APIs externas e serviços de dados financeiros (`financeService.ts`).
* `/src/lib/`: Funções utilitárias, cálculos complexos de portfólio (`portfolioCalc.ts`) e configuração do Supabase.
* `/api/`: Backend Express para rotas de proxy e web scraping de dados financeiros.

---

## 📈 Roadmap (Próximos Passos)

- [ ] Integração com Open Finance para importação automática de saldo de corretoras.
- [ ] Alertas de preço e notificações de pagamento de dividendos via e-mail/push.
- [ ] Suporte a múltiplos portfólios (ex: Carteira Aposentadoria, Carteira Arrojada).
- [ ] Exportação de relatórios em PDF para declaração anual do Imposto de Renda.

---
*Desenvolvido com foco em performance, design e inteligência financeira.*
