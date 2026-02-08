const evolutionService = require('../services/evolutionService');
const logger = require('../services/loggerService');

/**
 * Adapter to convert Evolution API Webhook payload to a format compatible with 
 * the existing 'handleMessage' function (adapting Evolution API webhook data).
 */
class EvolutionAdapter {
    constructor(webhookData) {
        this.data = webhookData;
        this.rawMessage = webhookData.data?.message || {};
        this.key = webhookData.data?.key || {};
        this.messageType = webhookData.data?.messageType || 'conversation';
        this.timestamp = webhookData.data?.messageTimestamp;
        this.pushname = webhookData.data?.pushName; // Map pushName

        // Capture Instance Name to reply correctly
        this.instanceName = webhookData.instance;

        // Sender ID (Remote JID)
        this.from = this.key.remoteJid;

        // Receiver ID (My Number)
        this.to = webhookData.sender; // Depends on Evolution payload structure

        // Construct ID object (compatibility format)
        this.id = {
            id: this.key.id,
            remote: this.key.remoteJid,
            fromMe: this.key.fromMe,
            _serialized: `${this.key.fromMe}_${this.key.remoteJid}_${this.key.id}`
        };

        // Extract Body/Content
        this.body = this.extractBody();

        // Determine Type
        this.type = this.mapType(this.messageType);

        // Media Check
        this.hasMedia = ['image', 'video', 'audio', 'ptt', 'document', 'sticker'].includes(this.type);
    }

    /**
     * Extract text body from various message types
     */
    extractBody() {
        if (this.rawMessage.conversation) return this.rawMessage.conversation;
        if (this.rawMessage.extendedTextMessage) return this.rawMessage.extendedTextMessage.text;
        if (this.rawMessage.imageMessage) return this.rawMessage.imageMessage.caption || '';
        if (this.rawMessage.videoMessage) return this.rawMessage.videoMessage.caption || '';
        if (this.rawMessage.documentMessage) return this.rawMessage.documentMessage.caption || this.rawMessage.documentMessage.fileName || '';
        return '';
    }

    /**
     * Map Evolution/Baileys message types to internal types
     */
    mapType(evolutionType) {
        const types = {
            'conversation': 'chat',
            'extendedTextMessage': 'chat',
            'imageMessage': 'image',
            'videoMessage': 'video',
            'audioMessage': 'audio', // Generic audio
            'documentMessage': 'document',
            'stickerMessage': 'sticker',
            'contactsArrayMessage': 'vcard',
            'locationMessage': 'location'
        };
        // Check for specific PTT (Voice Note) flag if available, typically in audioMessage
        if (evolutionType === 'audioMessage' && this.rawMessage.audioMessage?.ppt) {
            return 'ptt';
        }
        return types[evolutionType] || 'unknown';
    }

    /**
     * Reply function compatible with existing logic
     */
    async reply(content, chatId, options) {
        // user might pass Media object or text
        // Existing logic: await message.reply("text") or await message.reply(media)

        if (typeof content === 'string') {
            return await evolutionService.sendText(this.from, content, this.instanceName);
        }

        if (content && content.mimetype && content.data) {
            // It's a MessageMedia-like object
            // { mimetype, data, filename }
            let type = 'document';
            if (content.mimetype.startsWith('image')) type = 'image';
            if (content.mimetype.startsWith('audio')) type = 'audio';

            return await evolutionService.sendMedia(this.from, content, type, this.instanceName);
        }
    }

    /**
     * Download Media function
     * Since Evolution webhook (Message Upsert) might not contain full base64, 
     * we usually receive it in the payload if 'includeBase64' is enabled in options,
     * OR we have to fetch it.
     * 
     * For V2, Evolution often sends base64 in the payload if configured, 
     * or we might need to query the message content endpoint.
     * 
     * For this implementation, we assume base64 might be present or we return null/error 
     * if not readily available, prompting user to configure Evolution correctly.
     */
    async downloadMedia() {
        try {
            logger.debug(`Adapter: downloadMedia called`, { type: this.type, msgType: this.messageType });

            const msgContent = this.rawMessage[this.messageType];

            if (!msgContent) {
                logger.error("❌ No message content found for type", { type: this.messageType });
                return undefined;
            }

            // 1. Try to find direct Base64 in payload (Evolution option 'includeBase64')
            let base64 = msgContent.base64 || msgContent.file;

            // 2. Identify MimeType
            let mimetype = msgContent.mimetype || 'application/octet-stream';

            // 3. Identify Filename (or generate one)
            let filename = msgContent.fileName || 'file';
            if (this.type === 'image') filename = 'image.jpg';
            if (this.type === 'audio' || this.type === 'ptt') filename = 'audio.ogg';
            if (this.type === 'document' && !filename) filename = 'document.pdf';

            // If we have base64, return the object expected by MessageHandler
            if (base64) {
                logger.debug("Base64 found in payload", { length: base64.length });
                return {
                    data: base64,
                    mimetype: mimetype,
                    filename: filename
                };
            }

            // If no base64, normally we would fetch from Evolution API using ID.
            if (!base64) {
                logger.debug("Fetching Base64 from API...");
                // Fix: Pass full WAMessage object (this.data.data) not just content
                base64 = await evolutionService.getBase64FromMedia(this.data.data, this.instanceName);
            }

            if (base64) {
                logger.debug("Base64 fetched from API", { length: base64.length });
                return {
                    data: base64,
                    mimetype: mimetype,
                    filename: filename
                };
            }

            logger.warn("⚠️ No Base64 found in payload or API.");
            return undefined;

        } catch (error) {
            logger.error("❌ Error in downloadMedia", { error });
            return undefined;
        }
    }
}

module.exports = EvolutionAdapter;
