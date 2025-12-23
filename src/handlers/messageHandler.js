const fs = require('fs');
const path = require('path');
const { AIResponseSchema } = require('../schemas/transactionSchema');
// We need the client to send the access denied message specifically
const client = require('../services/whatsappClient');
const ffmpegPath = require('ffmpeg-static');
const supabase = require('../services/supabaseClient');
const { chatCompletion, analyzeImage, transcribeAudio, generateEmbedding, generateBatchEmbeddings } = require('../services/openaiService');
const imageStrategy = require('../strategies/ImageStrategy');
const audioStrategy = require('../strategies/AudioStrategy');
const pdfStrategy = require('../strategies/PdfStrategy');
const ofxStrategy = require('../strategies/OfxStrategy'); // NEW
const csvStrategy = require('../strategies/CsvStrategy'); // NEW
const xlsxStrategy = require('../strategies/XlsxStrategy'); // NEW
const textStrategy = require('../strategies/TextStrategy');
const userRepo = require('../repositories/UserRepository');
const transactionRepo = require('../repositories/TransactionRepository');

// FORÇANDO via Variável de Ambiente
process.env.FFMPEG_PATH = ffmpegPath;

const sessionService = require('../services/sessionService');
const queueService = require('../services/queueService');
const { processExtractedData } = require('../services/dataProcessor');
const logger = require('../services/loggerService');


async function handleMessage(message) {
    try {
        if (message.from === 'status@broadcast') return;

        logger.info("📩 Message Received", {
            from: message.from,
            type: message.type,
            hasMedia: message.hasMedia,
            body: message.body?.substring(0, 50)
        });

        const pushname = message._data?.notifyName || message.pushname;

        let user = await userRepo.findByPhone(message.from);

        if (!user) {
            // SECURITY: Only allow registered users
            logger.warn(`🚫 Acesso Negado: ${message.from}`);
            await client.sendMessage(message.from, "❌ *Acesso Negado*\n\nEste bot é privado e exclusivo para usuários convidados.\n\nPeça seu convite ao administrador para começar.");
            return;
        } else if (pushname && !user.name) {
            // Backfill name if missing for existing users
            await userRepo.updateName(user.id, pushname);
        }

        // Initialize/Fetch Context from Redis
        let userContext = await sessionService.getContext(user.id);

        // Strategy Selection
        let result = null;

        const bodyLower = message.body.toLowerCase().trim();

        // COMMAND: /onboarding (Trigger Intro without deleting Data)
        if (bodyLower === '/onboarding' || bodyLower === '/start') {
            await sessionService.clearContext(user.id);
            await sessionService.clearPdfState(user.id);
            await sessionService.clearPendingCorrection(user.id);

            // Trick: Replace message body with instruction so AI generates the onboarding text
            // Added timestamp or unique token to prevent semantic caching of the refusal
            message.body = `[SYSTEM_INIT] Aja como se fosse meu primeiro acesso. Faça sua introdução de boas-vindas amigável e explique como você pode me ajudar.`;

            // Let flow continue... (It will skip other commands and hit TextStrategy)
        }

        // HANDSHAKE: Setup Message Trigger
        if (message.body.includes("Olá! Quero começar a economizar com a Porquim IA")) {
            // Check if user has setup goal
            if (user.savings_goal && user.monthly_income) {
                const available = user.monthly_income - user.savings_goal;
                const response = `Oi ${user.pushname || 'Campeão'}! 🐷\n\nTudo pronto. Já vi aqui que sua meta é poupar *R$ ${user.savings_goal}* este mês. 🎯\nIsso deixa você com cerca de *R$ ${available}* para gastos livres.\n\nAgora é só me avisar sempre que gastar algo. Ex: "Gastei 30 reais no almoço".\n\n👇 *Vamos testar?* Me conta sua última compra!`;

                await client.sendMessage(message.from, response);
                return; // Stop here, no AI needed for this scripted welcome
            }
        }

        if (bodyLower === '/esquecer') {
            await sessionService.clearContext(user.id);
            await sessionService.clearPdfState(user.id);
            await sessionService.clearPendingCorrection(user.id);
            return message.reply("🧹 Memória de curto prazo limpa! Esqueci nossa conversa recente.\n(Seus dados salvos continuam aqui).");
        }

        // COMMAND: /reset (Hard Reset - New User Simulation)
        if (bodyLower === '/reset' || bodyLower === '/novo_usuario') {
            await message.reply("⚠️ Iniciando reset total de fábrica...");
            try {
                // 1. Clear Redis
                await sessionService.clearContext(user.id);
                await sessionService.clearPdfState(user.id);
                await sessionService.clearPendingCorrection(user.id);

                // 2. Delete DB Params
                await userRepo.delete(user.id);

                return message.reply("✨ Tudo apagado! Sou um novo bot para você.\nMande um 'Oi' para começar do zero.");
            } catch (e) {
                logger.error("Reset Error", e);
                return message.reply("❌ Erro ao resetar. Tente novamente.");
            }
        }

        // COMMAND: /relatorio (PDF Report)
        if (bodyLower === '/relatorio') {
            await message.reply("📊 Gerando seu relatório mensal em PDF... Aguarde um instante.");
            try {
                const reportService = require('../services/reportService');
                const { MessageMedia } = require('whatsapp-web.js'); // Ensure MessageMedia is available

                const pdfBuffer = await reportService.generateMonthlyReport(user.id);
                const base64Pdf = pdfBuffer.toString('base64');

                const media = new MessageMedia('application/pdf', base64Pdf, 'Relatorio_Mensal.pdf');
                return message.reply(media);
            } catch (err) {
                logger.error("Falha ao gerar relatório", { error: err });
                return message.reply("❌ Erro ao gerar o relatório. Tente novamente mais tarde.");
            }
        }

        // 0. State Check: Waiting for PDF Password?
        const pendingPdfBase64 = await sessionService.getPdfState(user.id);

        if (pendingPdfBase64 && !message.hasMedia) {
            // Assume text is password
            const password = message.body.trim();

            // Offload Password Retry to Worker
            await message.reply("⏳ Verificando senha e processando...");
            logger.info('Queueing PDF Password Retry', { userId: user.id });

            await queueService.addJob('RETRY_PDF_PASSWORD', {
                chatId: message.from,
                userId: user.id,
                mediaData: pendingPdfBase64, // The locked file
                password: password,
                filename: 'locked.pdf'
            });

            return;
        }

        // 0-B. Check for Pending Correction (Feedback Loop)
        const pendingCorrection = await sessionService.getPendingCorrection(user.id);

        if (pendingCorrection && !pendingCorrection.is_processed) {
            const isConfirmation = ['sim', 's', 'correto', 'ok', 'confirmado'].includes(bodyLower);
            const isDenial = ['nao', 'não', 'n', 'errado', 'erro', '!'].includes(bodyLower) || bodyLower.startsWith('!');

            if (isConfirmation) {
                // User confirmed the low-confidence transaction
                await Promise.all(pendingCorrection.transactionIds.map(id =>
                    transactionRepo.update(id, { status: 'confirmed', is_validated: true })
                ));
                await sessionService.clearPendingCorrection(user.id);
                return message.reply("✅ Confirmado! Já registrei.");
            }

            if (isDenial) {
                // User says it's wrong. Log it and ask for correction.
                await supabase.from('transaction_learning').insert({
                    original_input: pendingCorrection.last_input,
                    ai_response: pendingCorrection.ai_response,
                    user_correction: message.body, // Inicialmente capturamos a negação, mas o ideal é que ele DIGA o certo.
                    confidence_at_time: pendingCorrection.confidence
                });

                // If they just said "Wrong", ask for the right data. 
                // If they sent data (e.g. "Foi 50 reais"), we should process it as new.
                // For simplicity: Clear pending, and let the message flow continue as a new text processing? 
                // User: "Errado" -> Bot: "Ops. Qual o certo?"
                // User: "Foi 50 mercado" -> Process as normal.

                // If message is JUST "Errado", ask for input.
                if (bodyLower.length < 10) {
                    await sessionService.clearPendingCorrection(user.id); // Clear lock
                    return message.reply("Ops! Entendi errado. 😅\nComo foi o gasto correto? (Ex: '50 mercado')");
                }

                // If message is longer, treat as the correction itself
                await sessionService.clearPendingCorrection(user.id);
                // Flow fallthrough to normal processing below...
            }
        }

        // Quick Action: "!" or "Errado" on ANY message (Manual Drift Trigger)
        if (bodyLower === '!' || bodyLower === 'errado') {
            // Logic for manual correction of PREVIOUS message?
            // Need context of last bot message. Hard without ID tracking of bot messages.
            // For now, simpler implementation:
            return message.reply("Opa! Se eu errei algo anterior, por favor digite o gasto correto novamente.");
        }


        // Safeguard: Ignore 'chat' type even if hasMedia is true (prevents bugs)
        if (message.hasMedia && message.type !== 'chat') {

            const media = await message.downloadMedia();
            if (!media) {
                logger.warn('Failed to download media', { userId: user.id, messageId: message.id._serialized });
                return message.reply("❌ Não consegui baixar a mídia. Tente novamente.");
            }

            const base64Data = media.data;
            const mime = media.mimetype;
            const filename = media.filename || message.body || 'unknown';

            let jobType = null;

            if (message.type === 'image') {
                jobType = 'PROCESS_IMAGE';
            } else if (message.type === 'ptt' || message.type === 'audio') {
                jobType = 'PROCESS_AUDIO';
            } else if (message.type === 'document' && (mime === 'application/pdf' || filename.endsWith('.pdf'))) {
                jobType = 'PROCESS_PDF';
            } else if (message.type === 'document') {
                if (filename.endsWith('.ofx') || mime.includes('ofx')) {
                    jobType = 'PROCESS_OFX';
                } else if (filename.endsWith('.csv') || mime.includes('csv')) {
                    jobType = 'PROCESS_CSV';
                } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || mime.includes('excel') || mime.includes('spreadsheet')) {
                    jobType = 'PROCESS_XLSX';
                }
            }

            if (jobType) {
                await message.reply("⏳ Recebi seu arquivo! Estou processando e te aviso em instantes...");
                logger.info(`Queueing Job: ${jobType}`, { userId: user.id, filename });
                await queueService.addJob(jobType, {
                    chatId: message.from,
                    userId: user.id,
                    mediaData: base64Data,
                    mimeType: mime,
                    filename: filename,
                    body: message.body
                });
                return;
            }
        } else {
            result = { type: 'text_command', content: message.body };
        }

        if (!result) return;

        // --- Result Handling (Text Only) ---
        // Media results are now handled by Worker/Queue

        if (result.type === 'data_extraction') {
            // DEPRECATED path? TextStrategy usually returns 'ai_response'.
            // This block might never be hit if TextStrategy is used for everything.
            // Keeping for safety but `processExtractedData` call is duplicated below.
            const reply = async (text) => await message.reply(text);
            await processExtractedData(result.content, user.id, reply);

        } else if (result.type === 'text_command') {
            logger.debug(`[Handler] Executing Text Strategy for: "${result.content}"`);
            const response = await textStrategy.execute(result.content, message, user, userContext);
            logger.debug(`[Handler] Strategy Response Type: ${response.type}`);

            // Handler for Media Responses (PDFs, etc generated by Tools)
            if (response.type === 'media_response') {
                const { MessageMedia } = require('whatsapp-web.js');
                const { mimetype, data, filename, caption } = response.content;
                const media = new MessageMedia(mimetype, data, filename);
                await message.reply(media, undefined, { caption });
                return;
            }

            if (response.type === 'ai_response' || response.type === 'tool_response') {
                const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
                const reply = async (text) => await message.reply(text);

                // 1. Validar se é JSON (AI Response com 'gastos' ou 'transacoes')
                // Tenta extrair JSON se estiver envolto em texto
                let jsonStr = text;
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    jsonStr = text.substring(firstBrace, lastBrace + 1);
                }

                try {
                    // 2. Parse Inicial
                    const parsedRaw = JSON.parse(jsonStr);

                    // 3. Validação com Zod
                    const validation = AIResponseSchema.safeParse(parsedRaw);

                    if (validation.success) {
                        // Dados válidos! Processar.
                        const dataToProcess = {
                            ...validation.data,
                            prompt_version: response.metadata?.prompt_version || 'v1_stable'
                        };
                        const processingResult = await processExtractedData(dataToProcess, user.id, reply);

                        // HITL Check
                        if (processingResult && processingResult.status === 'pending_review') {
                            const txs = processingResult.transactions;
                            const mainTx = txs[0]; // Take first as example

                            // Save Session State
                            await sessionService.setPendingCorrection(user.id, {
                                last_input: result.content,
                                ai_response: validation.data,
                                confidence: processingResult.confidence,
                                transactionIds: txs.map(t => t.id)
                            });

                            // Interactive Reply
                            const confirmText = `Fiquei na dúvida sobre esse gasto. 🤔\n\n` +
                                `Entendi: *${mainTx.descricao}* - *R$ ${mainTx.valor.toFixed(2)}*\n\n` +
                                `Confirma? (Sim/Não)`;
                            await message.reply(confirmText);
                        }

                    } else {
                        // Validação falhou. Se parecia transação, avisa o user.
                        const isTransactionAttempt = jsonStr.includes('"gastos"') || jsonStr.includes('"transacoes"');

                        if (isTransactionAttempt) {
                            logger.warn("Falha de Validação Zod", { errors: validation.error.format(), input: text });
                            await message.reply("😵‍💫 Fiquei confuso com os dados. Poderia repetir de forma mais clara?");
                        } else {
                            // Apenas texto conversacional/Recusa/Piada
                            await message.reply(text);
                        }
                    }
                } catch (e) {
                    // Não é JSON. Se parecia, loga erro.
                    if (jsonStr.includes('"gastos"')) {
                        logger.error("JSON Syntax Error", { error: e.message, input: text });
                        await message.reply("❌ Erro técnico ao processar sua solicitação.");
                    } else {
                        await message.reply(text);
                    }
                }

                // Update context
                userContext.push({ role: "user", content: result.content });
                userContext.push({ role: "assistant", content: text });

                // Keep only last 10 messages
                if (userContext.length > 10) {
                    userContext = userContext.slice(-10);
                }

                // Save updated context to Redis with 24h TTL
                await sessionService.setContext(user.id, userContext, 86400);
            }
        }

    } catch (err) {
        logger.error("❌ Controller Error", { error: err, stack: err.stack });
    }
}
module.exports = { handleMessage };
