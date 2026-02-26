# Contexto do Projeto: Mepoupay (Porquim)

## Visão Geral
Assistente financeiro via WhatsApp operando com a Evolution API. O Mepoupay (Porquim) visa simplificar a gestão financeira pessoal e empresarial através de automação e integração fluida.

## Arquitetura Backend
- **Core:** Node.js
- **Filas e Assincronia:** Redis (BullMQ/custom) para processamento em background (mensagens, arquivos de mídia)
- **IA & NLP:** Processamento de linguagem natural com OpenAI para extração e categorização de dados financeiros
- **Banco de Dados:** Supabase (PostgreSQL) como banco de dados principal, utilizando edge functions, Auth e RLS conforme necessidade

## Arquitetura Frontend
- **Framework:** Dashboard construído em Next.js (App Router)
- **Estilização e UI:** Tailwind CSS integrado com componentes shadcn/ui para uma interface limpa e responsiva

## Infraestrutura
- **Deploy:** Containerizado via Docker e orquestrado com docker-compose
- **Hospedagem:** Instâncias cloud (Oracle Cloud)

## Regras de Negócio Core
1. **Inteligência:** Parseamento automático de despesas e categorização auxiliada por IA.
2. **Segurança:** Proteção estrita de dados do usuário.
3. **Multi-tenancy:** Separação lógica de tenants (perfis/usuários), onde todo dado deve pertencer a um `profile` e o acesso validado.
4. **Moeda:** Valores financeiros transitam ou são persistidos adequadamente (BRL).
5. **Idioma:** O bot deve interagir com os usuários em Português (BR).