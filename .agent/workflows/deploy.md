---
description: Deployment command for production releases. Pre-flight checks and deployment execution via Docker Compose.
---

# /deploy - Production Deployment (Docker)

$ARGUMENTS

---

## Purpose

This command handles production deployment on the VPS (e.g., Hetzner/Oracle). It involves pulling the latest code, running pre-flight checks, and rebuilding the Docker containers using `docker-compose`.

---

## Sub-commands

```
/deploy            - Run the full deployment pipeline
/deploy check      - Run pre-deployment checks only
/deploy build      - Force rebuild of Docker images
```

---

## Pre-Deployment Checklist

Before any deployment:

```markdown
## 🚀 Pre-Deploy Checklist

### Code Quality & Security
- [ ] No TypeScript errors in Dashboard (`npx tsc --noEmit`)
- [ ] ESLint passing (`npm run lint`)
- [ ] Security check: No hardcoded secrets in `.env` or code
- [ ] Prisma/Supabase migrations are up-to-date

### Performance
- [ ] Next.js build passes locally (`npm run build`)
- [ ] Worker routines checked for unhandled promise rejections

### Ready to deploy? (y/n)
```

---

## Deployment Flow (Docker Compose)

```
┌─────────────────┐
│  /deploy        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pre-flight     │
│  checks         │
└────────┬────────┘
         │
    Pass? ──No──► Fix issues
         │
        Yes
         │
         ▼
┌─────────────────┐
│ Git Pull Origin │
│ Main            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ docker-compose  │
│ -f docker-co... │
│ up -d --build   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Health check   │
│  & verify logs  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ✅ Complete    │
└─────────────────┘
```

---

## Execution Commands

A stack de produção do Mepoupay roda em Docker. O comando principal para aplicar as atualizações é:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Passos Internos:**
1. Baixar as últimas alterações (`git pull origin main`).
2. Reconstruir as imagens (`--build`) para garantir que as novas dependências e código do Frontend (Next.js) e Backend (Node.js Workers) sejam atualizadas.
3. Subir os containers em background (`-d`).
4. Verificar se os serviços essenciais (Redis, App, Worker) estão saudáveis (`docker ps`).

---

## Output Format

### Successful Deploy

```markdown
## 🚀 Deployment Complete

### Summary
- **Environment:** production (VPS / Hetzner)
- **Method:** Docker Compose Rebuild
- **Containers Updated:** `mepoupay-web`, `mepoupay-worker`, `redis`

### Health Check
✅ Web reagindo (200 OK)
✅ Worker conectado ao Redis
✅ Docker status: All containers Up
```

### Failed Deploy

```markdown
## ❌ Deployment Failed

### Error
Container build failed at step: Next.js compilation

### Resolution
1. Check standard output for Next.js build errors.
2. Verify environment variables in the `.env` file on the server.
3. Check Docker logs: `docker logs mepoupay-web --tail 50`.
```
