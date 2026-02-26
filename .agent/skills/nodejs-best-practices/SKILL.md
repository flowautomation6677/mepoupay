---
name: nodejs-best-practices
description: Core Node.js best practices for the Mepoupay backend. Focuses on asynchronous processing, error handling in WhatsApp (Evolution API) webhooks, and Redis (BullMQ) queue management.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Node.js Best Practices (Mepoupay Backend)

> **Core Philosophy:** O backend do Mepoupay é um pipeline assíncrono baseado em eventos (Webhooks) e processamento em background (Redis/BullMQ). Nunca bloqueie a thread principal e garanta que falhas no envio de mensagens não quebrem o processamento de mídia.

## 1. Assincronismo e Event Loop

- **Nunca bloqueie o Event Loop:** Não utilize métodos síncronos da `fs` (ex: `readFileSync`) dentro de rotas de webhook ou workers.
- **Processamento Pesado:** Processamento de arquivos (PDF, imagens, áudios convertidos via FFmpeg) e chamadas demoradas (OpenAI) **sempre** devem ser delegadas para o Worker do BullMQ, nunca executadas diretamente na requisição do Webhook.
- **Promise.all:** Sempre que for disparar múltiplas requisições de IO independentes (ex: consultas assíncronas no Supabase sobre usuários diferentes), envolva-as em `Promise.all()` em vez de dar `await` sequencial.

## 2. Tratamento de Erros e Webhooks (Evolution API)

- **Return Early no Webhook:** O webhook `/webhook/evolution` tem a única responsabilidade de ingerir o payload, extrair os dados e encaminhar para a camada de serviço/fila o mais rápido possível (`res.status(200).send('OK')`). Não espere tarefas de longa duração terminarem para responder.
- **Não crashe o Webhook:** Englobe o payload da Evolution API em blocos `try/catch`. Um erro não tratado no webhook fará com que a Evolution API receba falhas de timeout, forçando retentativas indesejadas que podem duplicar o processamento.
- **Tratamento Específico de Erro de Envio (Outbound):** Falhas em requisições feitas pela API da Evolution (como erro 404 por `instanceName` incorreto) devem ser logadas detalhadamente e as exceções devem ser capturadas e logadas no worker correspondente, mas **sem formatar como JSON Circular** na hora do log/rejeição do BullMQ. Extrate ou trunque apenas o `error.message` e o `error.response?.data`.

## 3. Gerenciamento do Redis e Fila (BullMQ)

- **Instância Compartilhada do Redis:** Use uma conexão singleton exportada através do `redisClient.js` para adicionar trabalhos (`queueService.addJob`) para economizar conexões com o Redis. Contudo, workers do BullMQ e event listeners devem ter sua própria instância dedicada (como `new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })`).
- **Idempotência (Remoção Pós-Execução):** Garanta que jobs de sucesso finalizem e sejam limpos para não entulhar o Redis (passe `{ removeOnComplete: true }` no `.add(...)`).
- **Resiliência:** Para falhas de outbound (envio de WhatsApp), as instâncias variam. O worker deve receber como opção o `instanceName` do contexto original. Quando há erro irrecuperável de payload, remova o job ou deixe-o falhar controladamente (porém trate o stack trace para não estourar o limite de tamanho do BullMQ com structs circulares do Axios). Limitando o objeto de erro para apenas propriedades rastreáveis.

---
## ❌ Anti-Patterns Absolutos

- ❌ Responder mensagens do usuário dentro da requisição do Webhook bloqueando a resposta 200 OK HTTP.
- ❌ Adicionar ao Redis o job usando `await` global de bibliotecas.
- ❌ Re-executar falhas infinitamente (sempre use attempts definidos no BullMQ e falhe graciosamente avisando o usuário na Queue de saída).
