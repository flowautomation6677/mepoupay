# Configuração de Secrets para Hetzner (GitHub Actions)

Este documento lista as variáveis de ambiente que você deve configurar nos **Settings > Secrets and variables > Actions** do seu repositório GitHub.

Esses valores serão injetados no arquivo `.env` do seu servidor durante o deploy.

## 🔑 Lista de Secrets

| Secret Name | Valor Recomendado (Produção) | Descrição |
| :--- | :--- | :--- |
| **SERVER_IP** | `123.123.123.123` | IP do seu servidor Hetzner. |
| **SERVER_USER** | `root` | Usuário SSH (geralmente root). |
| **SERVER_SSH_KEY** | `-----BEGIN OPENSSH PRIVATE KEY...` | Sua chave privada SSH para acesso ao servidor. |
| **OPENAI_API_KEY** | `sk-...` | Sua chave da OpenAI. |
| **EVOLUTION_API_KEY** | `429683C4C977415CAAFCCE10F7D57E11` | Chave de autenticação da Evolution API (Global). |
| **SUPABASE_URL** | `https://okvizpzxcdxltqjmjruo.supabase.co` | URL do seu projeto Supabase. |
| **SUPABASE_ANON_KEY** | `sb_publishable_...` | Chave pública do Supabase. |
| **SUPABASE_SERVICE_ROLE_KEY** | `sb_secret_...` | Chave secreta do Supabase (ignora RLS). |
| **POSTGRES_PASSWORD** | `sua-senha-segura-boadco` | Senha para o banco de dados PostgreSQL. |
| **POSTGRES_URL** | `postgresql://postgres:sua-senha-segura-boadco@postgres:5432/finance` | **Importante:** Use `postgres` como host, não localhost. |
| **REDIS_URL** | `redis://redis:6379` | **Importante:** Use `redis` como host. |
| **EVOLUTION_API_URL** | `http://evolution-api:8080` | **Importante:** Use `evolution-api` (nome do serviço interno). |
| **INTERNAL_WEBHOOK_URL** | `http://finance-bot:4000/webhook/evolution` | URL interna para o bot receber webhooks. |
| **WEBHOOK_PUBLIC_URL** | `https://bot.seudominio.com` | URL pública do seu bot (opcional, se usar domínio). |
| **NEXT_PUBLIC_EVOLUTION_API_URL** | `https://evolution.seudominio.com` | URL pública da Evolution (acessível pelo browser). |
| **NEXT_PUBLIC_EVOLUTION_API_KEY** | `429683C4C977415CAAFCCE10F7D57E11` | Mesma da `EVOLUTION_API_KEY`. |
| **NEXT_PUBLIC_SUPABASE_URL** | `https://okvizpzxcdxltqjmjruo.supabase.co` | Mesma da `SUPABASE_URL`. |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | `sb_publishable_...` | Mesma da `SUPABASE_ANON_KEY`. |

## ⚠️ Pontos de Atenção

1.  **Nomes dos Serviços**: Dentro do Docker na Hetzner, os serviços não se chamam `localhost`. Eles se chamam pelo nome definido no `docker-compose.yml`:
    *   Banco de Dados: `postgres`
    *   Redis: `redis`
    *   Evolution API: `evolution-api`
    *   Bot: `finance-bot`

2.  **HTTPS/Domínios**:
    *   Configure seu DNS (Cloudflare/Namecheap) para apontar para o IP da Hetzner.
    *   O `nginx-proxy` cuidará dos certificados SSL automaticamente se configurado.

3.  **Segurança**:
    *   Nunca commite arquivos `.env` com senhas reais no repositório. Use sempre os Secrets.
