# 📧 Configurando Resend no Supabase (SMTP)

O Supabase limita o envio de e-mails na versão gratuita. O **Resend** é a melhor alternativa: gratuito para até 3.000 e-mails/mês e com alta entregabilidade.

## Passo 1: Obter Credenciais no Resend
1.  Crie sua conta em [resend.com](https://resend.com).
2.  **Verifique seu Domínio:** (Ex: `mepoupay.com.br`). Isso é obrigatório para sair da caixa de spam.
    *   O Resend vai te dar 3 registros DNS (TXT/MX). Adicione-os onde você comprou seu domínio (Godaddy, Registro.br, Cloudflare).
3.  Vá em **API Keys** e crie uma nova chave.
    *   Nome: `Supabase Auth`
    *   Copie a chave (começa com `re_...`).

## Passo 2: Configurar Supabase
1.  Acesse seu Painel do Supabase.
2.  Vá em **Project Settings** (ícone de engrenagem) -> **Authentication**.
3.  Role até **SMTP Settings** e ative **Enable Custom SMTP**.
4.  Preencha assim:
    *   **Sender Email:** `nao-responda@seu-dominio.com` (Tem que ser do domínio verificado!)
    *   **Sender Name:** `Me Poupay`
    *   **Host:** `smtp.resend.com`
    *   **Port:** `465`
    *   **User:** `resend` (É sempre "resend", não mude).
    *   **Password:** `Sua API Key do Resend` (aquela `re_...`).
    *   **Minimum Interval:** 60 (padrão).

## Passo 3: Testar e Salvar
1.  Clique em **Save**.
2.  Tente fazer um cadastro novo no seu App (`/setup` ou link público).
3.  Verifique se o e-mail chegou (ele usará aquele Template HTML bonito que criamos!).

---

## ⚡ Dica Extra: Enviar E-mails pelo Código (Relatórios)
Se quiser que o Bot envie relatórios semanais por e-mail, podemos instalar a biblioteca do Resend no projeto Node.js também.

1.  Instale: `npm install resend`
2.  Configure no `.env`: `RESEND_API_KEY=re_...`
3.  Me avise se quiser implementar isso!
