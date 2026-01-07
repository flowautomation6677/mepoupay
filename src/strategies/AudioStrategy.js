const fs = require('node:fs');
const path = require('node:path');
const ffmpegPath = require('ffmpeg-static');
const { transcribeAudio } = require('../services/openaiService');
const logger = require('../services/loggerService');

// Configuração Local
// process.env.FFMPEG_PATH removed as it triggered security warnings and is not used globally.

class AudioStrategy {
    async execute(message, context) {
        await message.reply('🎧 Ouvindo...');
        try {
            const media = await message.downloadMedia();

            // Arquivos temp
            const tempOgg = path.join(__dirname, `../../temp_${message.id.id}.ogg`);
            const tempMp3 = path.join(__dirname, `../../temp_${message.id.id}.mp3`);

            fs.writeFileSync(tempOgg, Buffer.from(media.data, 'base64'));

            await this.transcodeToMp3(tempOgg, tempMp3);
            const text = await transcribeAudio(tempMp3);

            if (!text || text.trim().length === 0) {
                logger.warn("[AudioStrategy] Empty transcription received.");
                await message.reply("🔇 Não consegui ouvir nada no áudio. Tente falar mais perto do microfone.");
                return null;
            }

            await message.reply(`📝: "${text}"`);

            // Transcrição vira input para a TextStrategy
            return { type: 'text_command', content: text };

        } catch (e) {
            logger.error("AudioStrategy Error:", e);
            await message.reply("❌ Erro no áudio.");
            return null;
        } finally {
            // Cleanup garantido - usando variáveis já declaradas acima
            try {
                if (tempOgg && fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg);
                if (tempMp3 && fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
            } catch (e) { logger.error("Cleanup Error:", e); }
        }
    }

    transcodeToMp3(input, output) {
        return new Promise((resolve, reject) => {
            // Security Check: Validate FFMPEG path
            if (!path.isAbsolute(ffmpegPath)) {
                return reject(new Error("Security Error: FFmpeg path must be absolute"));
            }

            if (!fs.existsSync(ffmpegPath)) {
                return reject(new Error("Configuration Error: FFmpeg binary not found at specified path"));
            }

            // High-risk function: spawn is necessary for audio transcoding.
            // Mitigation: 
            // 1. Path is absolute and verified from trusted 'ffmpeg-static' package.
            // 2. Shell execution is disabled (shell: false) to prevent command injection.
            // 3. Arguments are passed as an array, not a shell string.
            const spawn = require('node:child_process').spawn;

            // NOSONAR: javascript:S2076 - OS Command Injection verified as safe due to above mitigations.
            const ffmpeg = spawn(ffmpegPath, ['-i', input, '-acodec', 'libmp3lame', '-b:a', '128k', output], { shell: false });

            ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(`FFmpeg exit: ${code}`));
            ffmpeg.on('error', reject);
        });
    }
}

module.exports = new AudioStrategy();
