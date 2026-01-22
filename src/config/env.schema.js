const { z } = require('zod');

const envSchema = z.object({
    // Core Application
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SERVER_PORT: z.string().transform(Number).default('3000'),

    // Database & Cache
    POSTGRES_URL: z.string().url(),
    REDIS_URL: z.string().url(),

    // Evolution API (WhatsApp)
    EVOLUTION_API_URL: z.string().url(),
    EVOLUTION_API_KEY: z.string().min(10),
    EVOLUTION_INSTANCE_NAME: z.string(),

    // Supabase (Auth/Storage)
    SUPABASE_URL: z.string().url(),
    SUPABASE_KEY: z.string().min(10),
    SUPABASE_ANON_KEY: z.string().min(10).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    // AI
    OPENAI_API_KEY: z.string().min(10),

    // Webhooks (Internal)
    INTERNAL_WEBHOOK_URL: z.string().url().optional(),
    WEBHOOK_PUBLIC_URL: z.string().url().optional(),
});

function validateEnv() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error("❌ Invalid environment variables:", result.error.format());
        // In local dev we might want to warn, in prod we exit
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
    return result.data;
}

module.exports = { validateEnv, envSchema };
