# Deploy Manuale Backend MIHUB su Hetzner

**Obiettivo:** Allineare backend production Hetzner all'ultimo commit master per attivare endpoint /api/dmsHub/* e /api/admin/deploy-backend

**Quando serve:** Deploy manuale una tantum per sbloccare deploy automatici futuri

**Operatore:** Amministratore sistema con accesso SSH Hetzner

---

## 📋 Prerequisiti

### Accesso SSH Hetzner

**Server:** 157.90.29.66  
**Utente:** root  
**Porta:** 22 (default)  
**Autenticazione:** Chiave SSH o password

**Comando login:**
```bash
ssh root@157.90.29.66
```

---

### Repository Backend

**GitHub:** https://github.com/Chcndr/mihub-backend-rest  
**Branch:** master  
**Commit target:** fe1eab7 (endpoint /api/dmsHub/*) + 7a1a0a2 (endpoint /api/admin/deploy-backend) + 32bdc49 (orchestratore MIO → Abacus SQL)

---

### Variabili Ambiente Richieste

**File:** `/root/mihub-backend-rest/.env`

**Variabili obbligatorie:**
```bash
# Database PostgreSQL Neon
DATABASE_URL=postgresql://user:password@host/database

# Port backend
PORT=3000

# Node environment
NODE_ENV=production

# GitHub webhook secret (per deploy automatici futuri)
GITHUB_WEBHOOK_SECRET=<da_generare_se_non_esiste>

# OpenAI API key (per orchestratore MIO)
OPENAI_API_KEY=<chiave_openai>
```

**Verifica variabili esistenti:**
```bash
cd /root/mihub-backend-rest
cat .env | grep -E "DATABASE_URL|PORT|NODE_ENV|GITHUB_WEBHOOK_SECRET|OPENAI_API_KEY"
```

---

## 🚀 Procedura Deploy Manuale

### Step 1: Login SSH Hetzner

```bash
ssh root@157.90.29.66
```

**Output atteso:**
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)
root@mihub-backend:~#
```

---

### Step 2: Navigare alla Directory Backend

```bash
cd /root/mihub-backend-rest
pwd
```

**Output atteso:**
```
/root/mihub-backend-rest
```

---

### Step 3: Verificare Branch Corrente

```bash
git branch
git status
```

**Output atteso:**
```
* master
On branch master
Your branch is behind 'origin/master' by X commits.
```

**Se branch diverso da master:**
```bash
git checkout master
```

---

### Step 4: Pull Ultimo Commit Master

```bash
git fetch origin
git pull origin master
```

**Output atteso:**
```
Updating abc1234..fe1eab7
Fast-forward
 routes/dmsHub.js | 85 ++++++++++++++++++++++++++++
 routes/adminDeploy.js | 120 ++++++++++++++++++++++++++++++++++++++
 routes/orchestrator.js | 45 ++++++++++++---
 src/modules/orchestrator/llm.js | 25 ++++++++
 4 files changed, 268 insertions(+), 7 deletions(-)
 create mode 100644 routes/dmsHub.js
 create mode 100644 routes/adminDeploy.js
```

**Commit importanti inclusi:**
- fe1eab7: Endpoint /api/dmsHub/* (markets, stalls, vendors, concessions)
- 7a1a0a2: Endpoint /api/admin/deploy-backend (deploy interno)
- 32bdc49: Orchestratore MIO → Abacus SQL (internalTraces)
- b8c3ecc: internalTraces popolati per debug Vista 4 agenti

---

### Step 5: Installare Dipendenze (se necessario)

**Verifica package.json modificato:**
```bash
git diff HEAD~5 package.json
```

**Se package.json modificato:**
```bash
npm install
```

**Altrimenti:**
```
# Skip - nessuna nuova dipendenza
```

---

### Step 6: Verificare File .env

```bash
cat .env | grep -E "DATABASE_URL|PORT|NODE_ENV"
```

**Output atteso:**
```
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production
```

**Se manca GITHUB_WEBHOOK_SECRET (per deploy automatici futuri):**
```bash
# Genera secret random
openssl rand -hex 32

# Aggiungi a .env
echo "GITHUB_WEBHOOK_SECRET=<secret_generato>" >> .env
```

---

### Step 7: Restart Backend con PM2

**Verifica processo PM2 esistente:**
```bash
pm2 list
```

**Output atteso:**
```
┌─────┬────────────────┬─────────┬─────────┬──────────┬────────┬──────┐
│ id  │ name           │ mode    │ status  │ restart  │ uptime │ cpu  │
├─────┼────────────────┼─────────┼─────────┼──────────┼────────┼──────┤
│ 0   │ mihub-backend  │ cluster │ online  │ 5        │ 10d    │ 0%   │
└─────┴────────────────┴─────────┴─────────┴──────────┴────────┴──────┘
```

**Restart backend:**
```bash
pm2 restart mihub-backend
```

**Output atteso:**
```
[PM2] Applying action restartProcessId on app [mihub-backend](ids: [ 0 ])
[PM2] [mihub-backend](0) ✓
┌─────┬────────────────┬─────────┬─────────┬──────────┬────────┬──────┐
│ id  │ name           │ mode    │ status  │ restart  │ uptime │ cpu  │
├─────┼────────────────┼─────────┼─────────┼──────────┼────────┼──────┤
│ 0   │ mihub-backend  │ cluster │ online  │ 6        │ 0s     │ 0%   │
└─────┴────────────────┴─────────┴─────────┴──────────┴────────┴──────┘
```

**Salva configurazione PM2:**
```bash
pm2 save
```

---

### Step 8: Verificare Backend Avviato

**Attendi 5 secondi per startup:**
```bash
sleep 5
```

**Verifica processo attivo:**
```bash
pm2 logs mihub-backend --lines 20
```

**Output atteso (nessun errore):**
```
0|mihub-ba | Server listening on port 3000
0|mihub-ba | Database connected successfully
0|mihub-ba | Routes loaded: /api/markets, /api/dmsHub, /api/admin, /api/mihub/orchestrator
```

**Se errori:**
```bash
# Verifica log completi
pm2 logs mihub-backend --lines 100

# Verifica .env
cat .env

# Verifica DATABASE_URL connessione
psql $DATABASE_URL -c "SELECT 1;"
```

---

### Step 9: Test Endpoint Health Check

**Da server Hetzner:**
```bash
curl -s http://localhost:3000/api/health | jq .
```

**Output atteso:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T05:00:00.000Z",
  "version": "1.0.0"
}
```

**Da browser/client esterno:**
```bash
curl -s https://mihub.157-90-29-66.nip.io/api/health | jq .
```

**Output atteso:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T05:00:00.000Z",
  "version": "1.0.0"
}
```

---

### Step 10: Test Endpoint /api/dmsHub/markets/list

**Da server Hetzner:**
```bash
curl -s http://localhost:3000/api/dmsHub/markets/list | jq .
```

**Output atteso:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "GR001",
      "name": "Mercato Grosseto",
      "municipality": "Grosseto",
      "days": "Martedì, Giovedì",
      "total_stalls": 160,
      "status": "active"
    }
  ],
  "count": 1
}
```

**Da browser/client esterno:**
```bash
curl -s https://mihub.157-90-29-66.nip.io/api/dmsHub/markets/list | jq .
```

**Se 404 NOT FOUND:**
```bash
# Verifica route caricata
pm2 logs mihub-backend | grep "Routes loaded"

# Verifica file routes/dmsHub.js esiste
ls -la /root/mihub-backend-rest/routes/dmsHub.js

# Verifica index.js include route dmsHub
grep "dmsHub" /root/mihub-backend-rest/index.js
```

---

### Step 11: Test Endpoint /api/admin/deploy-backend

**Da server Hetzner:**
```bash
curl -s -X POST http://localhost:3000/api/admin/deploy-backend \
  -H "Content-Type: application/json" \
  -H "x-agent-id: manus" \
  -d '{
    "reason": "Test deploy endpoint dopo deploy manuale",
    "branch": "master"
  }' | jq .
```

**Output atteso:**
```json
{
  "success": true,
  "message": "Deploy completed successfully",
  "agent": "manus",
  "reason": "Test deploy endpoint dopo deploy manuale",
  "branch": "master",
  "timestamp": "2025-11-28T05:00:00.000Z",
  "output": {
    "stdout": "Already up to date.\n...",
    "stderr": null
  }
}
```

**Da browser/client esterno:**
```bash
curl -s -X POST https://mihub.157-90-29-66.nip.io/api/admin/deploy-backend \
  -H "Content-Type: application/json" \
  -H "x-agent-id: manus" \
  -d '{
    "reason": "Test deploy endpoint da client esterno",
    "branch": "master"
  }' | jq .
```

**Se 403 Forbidden con x-agent-id diverso da manus/mio:**
```json
{
  "error": "Forbidden",
  "message": "Agent not authorized to deploy backend"
}
```
✅ **Corretto** - Solo manus e mio autorizzati

---

### Step 12: Verificare Script Deploy Esiste

```bash
ls -la /root/scripts/deploy-mihub.sh
```

**Output atteso:**
```
-rwxr-xr-x 1 root root 2048 Nov 28 05:00 /root/scripts/deploy-mihub.sh
```

**Se script non esiste:**
```bash
# Copia script da repo
mkdir -p /root/scripts
cp /root/mihub-backend-rest/scripts/deploy-mihub.sh /root/scripts/
chmod +x /root/scripts/deploy-mihub.sh
```

**Test script manualmente:**
```bash
/root/scripts/deploy-mihub.sh
```

**Output atteso:**
```
=== MIHUB Backend Deploy Script ===
Pulling latest changes from GitHub...
Already up to date.
No package.json changes, skipping npm install
Restarting PM2 process...
[PM2] Applying action restartProcessId on app [mihub-backend](ids: [ 0 ])
=== Health Checks ===
Checking /api/health... OK
Checking /api/markets... OK
=== Deploy Complete ===
```

---

## ✅ Checklist Post-Deploy

### Endpoint Funzionanti

- [ ] ✅ GET /api/health → 200 OK
- [ ] ✅ GET /api/markets → 200 OK (1 mercato)
- [ ] ✅ GET /api/markets/1 → 200 OK (dettagli Grosseto)
- [ ] ✅ GET /api/markets/1/stalls → 200 OK (160 posteggi)
- [ ] ✅ GET /api/vendors → 200 OK (lista vuota)
- [ ] ✅ GET /api/gis/health → 200 OK
- [ ] ✅ GET /api/gis/market-map → 200 OK (GeoJSON)
- [ ] ✅ GET /api/dmsHub/markets/list → 200 OK
- [ ] ✅ GET /api/dmsHub/markets/getById?marketId=1 → 200 OK
- [ ] ✅ GET /api/dmsHub/stalls/listByMarket?marketId=1 → 200 OK
- [ ] ✅ GET /api/dmsHub/vendors/list → 200 OK
- [ ] ✅ GET /api/dmsHub/concessions/list → 200 OK
- [ ] ✅ POST /api/admin/deploy-backend → 200 OK (con x-agent-id: manus)

### Dashboard PA Funzionante

- [ ] ✅ Apri https://mio-hub.me/dashboard-pa
- [ ] ✅ Gestione Mercati → Lista mercati visibile
- [ ] ✅ Gestione Posteggi → 160 posteggi visibili
- [ ] ✅ Gestione Imprese → Lista vuota (DB vuoto, ma endpoint funziona)
- [ ] ✅ Mappa Mercato → 160 posteggi colorati su mappa

### API Playground Funzionante

- [ ] ✅ Apri https://mio-hub.me/api-dashboard
- [ ] ✅ Test GET /api/dmsHub/markets/list → JSON grezzo 200 OK
- [ ] ✅ Test GET /api/dmsHub/stalls/listByMarket?marketId=1 → JSON grezzo 200 OK

---

## 🔄 Deploy Automatici Futuri

### Opzione 1: Endpoint Deploy Interno (Raccomandato)

**Dopo deploy manuale, MIO/Manus possono deployare via HTTP:**

```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/admin/deploy-backend \
  -H "Content-Type: application/json" \
  -H "x-agent-id: manus" \
  -d '{
    "reason": "Deploy nuova feature X da commit abc123",
    "branch": "master"
  }'
```

**Vantaggi:**
- ✅ Nessun SSH richiesto
- ✅ Guardian controlla permessi (solo manus/mio)
- ✅ Log deploy in Guardian logs
- ✅ MIO può orchestrare deploy automatici

**Limitazioni:**
- ⚠️ Richiede backend già aggiornato con endpoint (deploy manuale iniziale)

---

### Opzione 2: Webhook GitHub (Automatico)

**Setup webhook GitHub → Hetzner:**

**1. Genera secret webhook (se non esiste):**
```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6...
```

**2. Aggiungi secret a .env:**
```bash
echo "GITHUB_WEBHOOK_SECRET=a1b2c3d4e5f6..." >> /root/mihub-backend-rest/.env
pm2 restart mihub-backend
```

**3. Configura webhook GitHub:**
- URL: https://mihub.157-90-29-66.nip.io/webhook/deploy-mihub
- Content type: application/json
- Secret: a1b2c3d4e5f6... (stesso di .env)
- Events: push (solo branch master)

**4. Test webhook:**
```bash
# Push commit test su master
git commit --allow-empty -m "test: trigger webhook deploy"
git push origin master

# Verifica log backend
pm2 logs mihub-backend | grep "DEPLOY"
```

**Vantaggi:**
- ✅ Deploy automatico ogni push master
- ✅ Nessun intervento manuale
- ✅ Firma HMAC verifica autenticità

**Limitazioni:**
- ⚠️ Richiede configurazione iniziale SSH
- ⚠️ Deploy anche per commit non-critici

**Guida completa:** `07_guide_operative/WEBHOOK_DEPLOY_MIHUB.md`

---

## 🚨 Troubleshooting

### Problema: Backend non si avvia dopo restart

**Sintomo:**
```bash
pm2 logs mihub-backend
# Output: Error: Cannot find module 'express'
```

**Soluzione:**
```bash
cd /root/mihub-backend-rest
npm install
pm2 restart mihub-backend
```

---

### Problema: Endpoint 404 NOT FOUND

**Sintomo:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/dmsHub/markets/list
# Output: {"error":"Endpoint not found"}
```

**Cause possibili:**

**1. Route non caricata in index.js:**
```bash
grep "dmsHub" /root/mihub-backend-rest/index.js
# Se mancante, aggiungi:
# app.use('/api/dmsHub', require('./routes/dmsHub'));
```

**2. File routes/dmsHub.js non esiste:**
```bash
ls -la /root/mihub-backend-rest/routes/dmsHub.js
# Se mancante, git pull non completato
git pull origin master
pm2 restart mihub-backend
```

**3. Backend non restartato dopo pull:**
```bash
pm2 restart mihub-backend
```

---

### Problema: Database connection error

**Sintomo:**
```bash
pm2 logs mihub-backend
# Output: Error: connect ECONNREFUSED (database)
```

**Soluzione:**
```bash
# Verifica DATABASE_URL
cat /root/mihub-backend-rest/.env | grep DATABASE_URL

# Test connessione database
psql $DATABASE_URL -c "SELECT 1;"

# Se errore, verifica credenziali Neon PostgreSQL
```

---

### Problema: Endpoint deploy 403 Forbidden

**Sintomo:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/admin/deploy-backend \
  -H "x-agent-id: abacus" \
  -d '{"reason":"test"}'
# Output: {"error":"Forbidden"}
```

**Causa:** Solo manus e mio autorizzati

**Soluzione:** Usa x-agent-id: manus o mio
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/admin/deploy-backend \
  -H "x-agent-id: manus" \
  -d '{"reason":"test","branch":"master"}'
```

---

### Problema: Script deploy non eseguibile

**Sintomo:**
```bash
/root/scripts/deploy-mihub.sh
# Output: Permission denied
```

**Soluzione:**
```bash
chmod +x /root/scripts/deploy-mihub.sh
/root/scripts/deploy-mihub.sh
```

---

## 📝 Log Deploy

**Dopo deploy manuale, documenta:**

**Data deploy:** 28 novembre 2025  
**Operatore:** [Nome operatore]  
**Commit deployato:** fe1eab7 + 7a1a0a2 + 32bdc49  
**Endpoint attivati:** /api/dmsHub/*, /api/admin/deploy-backend  
**Test completati:** ✅ Tutti i 13 endpoint funzionanti  
**Dashboard PA:** ✅ Funzionante  
**API Playground:** ✅ Funzionante

**Aggiorna file:** `docs/mio/DEPLOY_STATUS.md`

---

## 📚 Riferimenti

**Documentazione correlata:**
- `07_guide_operative/WEBHOOK_DEPLOY_MIHUB.md` - Setup webhook GitHub
- `docs/mio/DEPLOY_STATUS.md` - Stato deploy sistema
- `reports/endpoints/ENDPOINTS_DMS_HUB_STATUS.md` - Audit endpoint
- `docs/api/ENDPOINT_IMPLEMENTATION_STATUS.md` - Status implementazione

**Repository:**
- Backend: https://github.com/Chcndr/mihub-backend-rest
- Frontend: https://github.com/Chcndr/dms-hub-app-new
- Blueprint: https://github.com/Chcndr/MIO-hub

---

**Fine Runbook**
