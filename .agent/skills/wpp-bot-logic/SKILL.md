---
name: wpp-bot-logic
description: Logic for WhatsApp bot integration using the Evolution API. Focuses on webhook payloads, message sending, and instance configuration.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Webhook & Evolution API Bot Logic

> **Core Philosophy:** O Mepoupay processa mensagens de contas de WhatsApp em tempo real através de Webhooks gerados pela Evolution API (v2). 

## 1. O Payload Genérico de Webhook

A Evolution API dispara POST requests para nosso `/webhook/evolution`. O formato básico tem esta estrutura de interesse (`body.data`):

```json
{
  "event": "messages.upsert",
  "instance": "FinanceBot_v3",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE5ABCDEF123456"
    },
    "pushName": "Nome do Usuário",
    "message": {
      "conversation": "Comprei um café por R$ 10,00"
    },
    "messageType": "conversation"
  },
  "sender": "5511999999999@s.whatsapp.net"
}
```

- Lidamos apenas com as mensagens onde `fromMe` é falso, a menos que estejamos observando eventos de confirmação.
- `remoteJid` é usado para identificar de quem a mensagem veio.

## 2. Tipos de Mensagem (messageType)

1. **conversation / extendedTextMessage:** Texto normal.
2. **audioMessage:** Pode ser nota de voz ou áudio MP3.
3. **imageMessage:** Imagem enviada do celular.
4. **documentMessage:** Pode ser PDF, CSV, OFX.

*Quando for áudio ou documento, a Evolution não envia o arquivo em si como raw no Webhook, mas informa que existe uma `mediaMessage`. O Worker no backend precisa chamar o endpoint específico da API (ex: `/chat/getBase64FromMediaMessage/${instanceName}`) usando a API Key para recuperar o Base64.*

## 3. Envios (Outbound)

Ao enviar mensagens, usamos a arquitetura de enfileiramento (`queueService.addOutbound` -> `outboundWorker`) para:
1. Formatar texto ou recuperar o buffer/base64 da mídia.
2. Chamar o serviço HTTP da Evolution (`evolutionService.sendText` ou `evolutionService.sendMedia`).
3. É crítico sempre capturar o `instanceName` recebido pelo webhook no estágio de entrada e repassá-lo na resposta, pois a API exige a URL com o respectivo `/message/sendText/:instanceName`.
