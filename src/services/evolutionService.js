const axios = require('axios');
const logger = require('./loggerService');

class EvolutionService {
    constructor() {
        this.baseUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        this.apiKey = process.env.EVOLUTION_API_KEY;
        this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'FinanceBot_v3';

        if (!this.apiKey) {
            logger.error('❌ EVOLUTION_API_KEY is missing in .env');
        }

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'apikey': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Send a text message
     * @param {string} to - Remote JID
     * @param {string} text - Message content
     * @param {string} [instanceName] - Optional instance name override
     */
    async sendText(to, text, instanceName) {
        try {
            const targetInstance = encodeURIComponent(instanceName || this.instanceName);
            const url = `/message/sendText/${targetInstance}`;
            const body = {
                number: to,
                text: text,
                delay: 1200,
                linkPreview: false,
                presence: 'composing'
            };

            const response = await this.client.post(url, body);
            return response.data;
        } catch (error) {
            logger.error('❌ Error sending text via Evolution API', { error: error.message, data: error.response?.data });
            throw error;
        }
    }

    /**
     * Send media (Image, Audio, Document)
     * @param {string} to - Remote JID
     * @param {object} media - { mimetype, data (base64), filename, caption }
     * @param {string} type - 'image', 'audio', 'document'
     * @param {string} [instanceName] - Optional instance name override
     */
    async sendMedia(to, media, instanceName, type = 'document') {
        try {
            const targetInstance = encodeURIComponent(instanceName || this.instanceName);
            const url = `/message/sendMedia/${targetInstance}`;

            const body = {
                number: to,
                options: {
                    delay: 1200,
                    presence: 'composing'
                },
                mediaMessage: {
                    mediatype: type,
                    caption: media.caption || '',
                    media: media.data, // Base64
                    fileName: media.filename || 'file'
                }
            };

            const response = await this.client.post(url, body);
            return response.data;
        } catch (error) {
            logger.error('❌ Error sending media via Evolution API', { error: error.message, data: error.response?.data });
            throw error;
        }
    }

    /**
     * Set Webhook for the instance
     * @param {string} webhookUrl - Public URL of this server
     */
    async setWebhook(webhookUrl) {
        try {
            const encodedInstance = encodeURIComponent(this.instanceName);
            const url = `/webhook/set/${encodedInstance}`;
            const body = {
                webhook: {
                    enabled: true,
                    url: webhookUrl,
                    webhookUrl: webhookUrl,
                    webhookByEvents: true,
                    events: [
                        "MESSAGES_UPSERT",
                        "MESSAGES_UPDATE",
                        "SEND_MESSAGE"
                    ]
                }
            };
            await this.client.post(url, body);
            logger.info(`✅ Webhook configured for instance ${this.instanceName} -> ${webhookUrl}`);
        } catch (error) {
            // If instance doesn't exist, we might need to create it, but for now just log error
            logger.error('❌ Error setting webhook', { error: error.message });
        }
    }

    /**
     * Check if instance is connected
     */
    async checkConnection() {
        try {
            const encodedInstance = encodeURIComponent(this.instanceName);
            const url = `/instance/connectionState/${encodedInstance}`;
            const response = await this.client.get(url);
            return response.data?.instance?.state === 'open';
        } catch (error) {
            return false;
        }
    }
    /**
     * Get Base64 from Media Message
     * @param {object} messageObject - The full message object from the webhook
     * @param {string} [instanceName]
     */
    async getBase64FromMedia(messageObject, instanceName) {
        try {
            const targetInstance = encodeURIComponent(instanceName || this.instanceName);
            const url = `/chat/getBase64FromMediaMessage/${targetInstance}`;

            const body = {
                message: messageObject,
                convertToMp4: false
            };

            const response = await this.client.post(url, body);
            return response.data?.base64;
        } catch (error) {
            logger.error('❌ Error fetching base64 from Evolution API', { error: error.message });
            return null;
        }
    }
}

module.exports = new EvolutionService();
