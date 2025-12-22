const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { transcribeAudio } = require('../services/openaiService');

// Configuração Local
process.env.FFMPEG_PATH = ffmpegPath;

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
                console.warn("[AudioStrategy] Empty transcription received.");
                await message.reply("🔇 Não consegui ouvir nada no áudio. Tente falar mais perto do microfone.");
                return null;
            }

            await message.reply(`📝: "${text}"`);

            // Transcrição vira input para a TextStrategy
            return { type: 'text_command', content: text };

        } catch (e) {
            console.error("AudioStrategy Error:", e);
            await message.reply("❌ Erro no áudio.");
            return null;
        } finally {
            // Cleanup garantido
            try {
                const tempOgg = path.join(__dirname, `../../temp_${message.id.id}.ogg`);
                const tempMp3 = path.join(__dirname, `../../temp_${message.id.id}.mp3`);
                if (fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg);
                if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
            } catch (e) { console.error("Cleanup Error:", e); }
        }
    }

    transcodeToMp3(input, output) {
        return new Promise((resolve, reject) => {
            const ffmpeg = require('child_process').spawn(ffmpegPath, ['-i', input, '-acodec', 'libmp3lame', '-b:a', '128k', output]);
            ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(`FFmpeg exit: ${code}`));
            ffmpeg.on('error', reject);
        });
    }
}

module.exports = new AudioStrategy();
