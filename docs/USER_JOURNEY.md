# 🗺️ Jornada do Usuário (User Journey)

Esta é a descrição completa do fluxo que um novo usuário percorre no **Porquim 360**, desde o cadastro até o uso diário.

## 1. Entrada e Cadastro (Web)
*   **Acesso:** O usuário acessa o link do app (ex: `app.porquimia.com.br`).
*   **Login/Cadastro:** Usa o sistema de Autenticação (Supabase) para criar conta com E-mail/Senha ou Google.
*   **Smart Redirect:** Se for o primeiro acesso, o sistema detecta que o `onboarding_completed` é `FALSE` e o redireciona automaticamente para `/setup`.

## 2. O Wizard de Configuração (`/setup`)
Este é o fluxo "Sem Atrito" que criamos para configurar o assistente.

*   **Passo 1: Conexão (WhatsApp)**
    *   O usuário digita seu número (com máscara automática).
    *   *Sistema:* Salva o número no banco de dados (`perfis.whatsapp_number`).

*   **Passo 2: Definição de Metas**
    *   O usuário informa:
        *   **Renda Mensal** (Quanto ganha).
        *   **Meta de Economia** (Quanto quer guardar).
    *   *Feedback Visual:* O sistema calcula instantaneamente quanto ele pode gastar por dia.
    *   *Sistema:* Atualiza o perfil com esses valores (`monthly_income`, `savings_goal`) e marca `onboarding_completed = TRUE`.

*   **Passo 3: O "Aperto de Mão" Digital**
    *   Tela de sucesso com um botão grande: **"Chamar no WhatsApp"**.
    *   Este botão abre o WhatsApp direto na conversa com o Bot, com uma mensagem pré-digitada: *"Olá! Quero começar a economizar..."*.

## 3. Ativação no WhatsApp (`/start`)
*   **Ação:** O usuário envia a mensagem pré-digitada.
*   **Recepção Inteligente:**
    *   O Bot recebe a mensagem.
    *   Verifica no banco de dados se aquele número tem Meta Financeira definida.
*   **Resposta Personalizada (WOW Moment):**
    *   Em vez de um "Oi" genérico, o Bot responde:
        > "Oi [Nome]! 🐷 Já sei que sua meta é poupar **R$ 1.000** este mês. Isso te deixa com R$ X livres..."
    *   Isso cria uma conexão imediata, mostrando que o Bot já "conhece" o usuário.

## 4. Uso Diário (Core Loop)
*   **Registro de Gastos:**
    *   Usuário envia: *"Gastei 20 no almoço"*.
    *   **IA (Sherlock V2):**
        *   Detecta a categoria automaticamente (Alimentação).
        *   Confere se é uma gíria e padroniza.
    *   **Confirmação:** Bot responde com o registro e uma pitada de personalidade.

*   **Consultas:**
    *   Usuário pergunta: *"Quanto já gastei de Lazer?"*.
    *   Bot consulta o banco e responde com o saldo atualizado.

## 5. Dashboard Administrativo (Web)
*   O usuário (ou Admin) pode voltar ao site `/dashboard` para ver gráficos detalhados, Heatmaps de comportamento e gerenciar sua assinatura.
