---
name: finance-parser-dev
description: Logic for parsing financial text/audio/images using OpenAI and structuring it into JSON categories. Focuses on the mapping of inputs to the DB `transactions` table.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# OpenAI Finance Parser (Mepoupay)

> **Core Philosophy:** O Mepoupay envia entradas brutas (texto, áudio transcrito, OCR de imagens, ou leitura de PDFs) para a OpenAI estruturar a despesa ou receita em um JSON determinístico que nossa base de dados espera.

## 1. O Payload Esperado pela Aplicação (JSON Strict)

A OpenAI (usando *Structured Outputs* com Zod ou system prompt rigoroso) deve sempre retornar o seguinte formato (baseado no `transactionSchema.js` e na tabela `transactions` do Supabase):

```json
{
  "amount": 1050, 
  "description": "Café na padaria",
  "category_id": "00000000-0000-0000-0000-000000000000", /* UUID válido extraído das categorias do usuário */
  "date": "2023-10-25T14:30:00.000Z",
  "type": "EXPENSE", /* ou "INCOME" */
  "payment_method": "PIX", /* CREDIT_CARD, DEBIT_CARD, CASH, TRANSFER, BOLETO, OTHER */
  "status": "COMPLETED", /* PENDING, COMPLETED, CANCELLED */
  "installments": 1
}
```

*Regra de Ouro:* `amount` é sempre um **inteiro em centavos** (isto é, R$ 10,50 = 1050).

## 2. Abordagens por Tipo de Mídia

1. **Texto/Áudio (TextStrategy / AudioStrategy)**: Recebe a string de áudio (transcrita via Whisper) ou texto natural. O papel da OpenAI é ler "Gastei dez com cinquenta no almoço hoje no crédito" e converter no JSON acima, usando a data de hoje.
2. **Imagens/Fotos de Recibos (ImageStrategy)**: O `gpt-4o-mini` ou similar processa o Base64 da imagem e preenche o esquema com os dados extraídos visuais.
3. **PDF (PdfStrategy)**: Texto extraído do Node.js é consolidado ou sumarizado por blocos (podendo retornar um `array` de transações ao ler uma fatura, por exemplo).

## 3. Tratamento de Erros da OpenAI

1. Se a IA falhar em classificar a categoria (`category_id`), ela deve cair para uma categoria padrão ou preencher `null`, aguardando a retificação pelo usuário no dashboard.
2. A IA não acessa o banco diretamente. Ela devolve o JSON, e nosso `dataProcessor.js` (ou repositório) cruza o dado para garantir que a categoria existe no Supabase pertencendo àquele usuário através do ID do usuário logado. Se a categoria devolvida pela IA for um "texto", a camada de repositório converte isso em UUID criando uma nova categoria on-the-fly (`upsertCategory`).
