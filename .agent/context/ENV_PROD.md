---
description: Context for the PRODUCTION Environment
---

# 🚀 PRODUCTION Environment Context (mepoupay-prod)

## 📌 Identification
- **Supabase Project Name:** `mepoupay-prod`
- **Purpose:** Live Application for Real Users.

## 🔗 Endpoints (Oracle Cloud)
- **Web Dashboard URL:** `https://mepoupay.app.br`
- **Finance Bot / Webhook:** `http://5.161.89.46:4000`

## 🔴 P0 CRITICAL WARNING: MAXIMUM SECURITY
This is the **LIVE PRODUCTION** environment.
- **NEVER** drop tables, execute destructive DDL commands, or alter the schema directly without a fully documented and tested Rollback Plan.
- **NEVER** delete real user data.
- **ALWAYS** double-check `.env` and `prod.env` keys before touching anything that resembles Production (`okviz...`).
