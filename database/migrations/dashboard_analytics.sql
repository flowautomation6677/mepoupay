-- Analytics for Admin Dashboard
-- Run this in Supabase SQL Editor

-- 1. AI Efficiency View (The Lab)
-- Shows performance per prompt version
CREATE OR REPLACE VIEW view_ai_efficiency AS
SELECT 
    prompt_version,
    COUNT(*) as total_samples,
    COUNT(*) FILTER (WHERE is_human_corrected = true) as corrections,
    COUNT(*) FILTER (WHERE confidence_score < 0.7) as low_confidence_count,
    ROUND((COUNT(*) FILTER (WHERE is_human_corrected = true)::numeric / COUNT(*)) * 100, 2) as error_rate_percent,
    AVG(confidence_score) as avg_confidence
FROM transacoes
WHERE prompt_version IS NOT NULL
GROUP BY prompt_version;


-- 2. Financial Metrics View (The CFO)
-- Estimates costs based on transaction volume (Simulated Token Math)
-- Assuming average input 500 tokens, output 200 tokens.
-- GPT-4o-mini approx cost: Input $0.15/1M, Output $0.60/1M
CREATE OR REPLACE VIEW view_financial_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as daily_transactions,
    -- Est. Cost Calculation (Very rough approximation)
    -- (Tx * (InputTokens * InputPrice + OutputTokens * OutputPrice))
    ROUND((COUNT(*) * (500 * 0.00000015 + 200 * 0.00000060))::numeric, 4) as est_cost_usd
FROM transacoes
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;


-- 3. User Behavior View (The Product Owner)
-- Heatmap data (Day of Week + Hour)
CREATE OR REPLACE VIEW view_user_behavior_heatmap AS
SELECT 
    EXTRACT(DOW FROM created_at) as day_of_week, -- 0=Sun, 6=Sat
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    COUNT(*) as activity_count
FROM transacoes
GROUP BY day_of_week, hour_of_day
ORDER BY day_of_week, hour_of_day;


-- 4. Recent Errors for "Synthesize C" (The Lab)
CREATE OR REPLACE VIEW view_recent_errors AS
SELECT 
    id,
    created_at,
    prompt_version,
    descricao as ai_extracted,
    -- In a real scenario we'd need the 'original_input' joined from transaction_learning
    -- For now, we listed failed transactions
    is_human_corrected
FROM transacoes
WHERE is_human_corrected = true
ORDER BY created_at DESC
LIMIT 50;
