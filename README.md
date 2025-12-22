🐷 Porquim 360 (V2 - Modular)

O Porquim 360 é um bot financeiro inteligente para WhatsApp que utiliza IA para automatizar a gestão de finanças pessoais. Ele permite que os usuários registrem transações enviando mensagens de texto, áudios, imagens de comprovantes ou arquivos bancários, processando tudo automaticamente e exibindo os dados em um dashboard web moderno.

🚀 Funcionalidades Principais
### 🧠 Inteligência Artificial & Aprendizado (Machine Learning Loop)
O Porquim 360 não apenas "lê" dados, ele evolui com o uso graças à arquitetura de **Shadow Prompting** e **Human-in-the-Loop (HITL)**:
- **Shadow Prompting (Teste A/B):** O sistema executa múltiplas versões de prompts (Ex: `v1_stable` vs `v2_experimental`) em paralelo para medir eficiência. Atualmente testa prompts capazes de entender gírias brasileiras ("breja", "gasosa").
- **Auto-Correção (Feedback Loop):** Se a confiança da IA for baixa (< 70%), o bot solicita confirmação do usuário. As correções são salvas e usadas para "re-treinar" o modelo (Fine-Tuning), criando um dataset ouro.
- **Detecção de Fraude/Anomalia (Vision):** Análise avançada de imagens para distinguir recibos reais de fotos aleatórias.

### 🏢 Nexus Command Center (Admin Dashboard)
Painel administrativo "C-Level" para monitoramento total:
- **The Lab:** Acompanhe a batalha entre prompts e a matriz de confusão da IA.
- **The CFO:** Gráficos de custos operacionais (OpenAI Tokens) e economia gerada.
- **The SRE:** Monitoramento de latência e saúde das filas (BullMQ).

### 📂 Suporte Multi-Formato Modulo
Estratégias modulares para processar diferentes arquivos:
- **📄 PDF & Imagens:** Leitura de comprovantes e documentos protegidos por senha.
- **📊 Bancários:** Suporte nativo para OFX e CSV.
- **📑 Planilhas:** Importação direta de XLSX.
- **🎙️ Áudio:** Transcrição via Whisper (OpenAI) com extração estruturada.

### 🛡️ Segurança & Privacidade
- **RLS (Row Level Security):** Dados isolados nível banco de dados no Supabase.
- **PII Redaction:** Governança automática para remover dados sensíveis antes de enviar para a IA.

🛠️ Stack Tecnológica
Backend (Bot)
Runtime: Node.js

WhatsApp: whatsapp-web.js

IA: OpenAI API

Banco de Dados: Supabase (PostgreSQL)

Fila/Cache: BullMQ & Redis

Logs: Winston com rotação diária

Frontend (Dashboard)
Framework: Next.js 15+ (App Router)

UI: Tailwind CSS, Framer Motion (animações) e Lucide React (ícones)

Gráficos: Recharts

Autenticação: Supabase SSR

📋 Pré-requisitos
Node.js (v18 ou superior)

Redis Server (para as filas de processamento)

Conta no Supabase

Chave de API da OpenAI

⚙️ Configuração
Clone o repositório:

Bash

git clone https://github.com/seu-usuario/porquim360.git
cd porquim360
Configure as variáveis de ambiente: Crie um arquivo .env na raiz do projeto e em web-dashboard/ com as seguintes chaves:

Snippet de código

OPENAI_API_KEY=sua_chave_aqui
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anon_aqui
# Opcional para tarefas admin
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
Instale as dependências e inicie o Bot:

Bash

npm install
npm start
Inicie o Dashboard:

Bash

cd web-dashboard
npm install
npm run dev
🛡️ Segurança e RLS
A segurança é tratada a nível de banco de dados através do Row Level Security (RLS) do Supabase.

Todas as tabelas (perfis, transacoes) devem ter o RLS habilitado.

As consultas utilizam a SUPABASE_ANON_KEY, respeitando o contexto do usuário autenticado.

🧪 Testes
O projeto conta com uma suíte de testes unitários e de integração:

Backend: npm test (Jest)

E2E (Dashboard): npm run test:e2e (Playwright)
