# Integrazione Zapier per MIO-hub e MIHUB

**Versione**: 1.0.0  
**Data**: 18 novembre 2025  
**Autore**: Abacus (Manus AI)

---

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Zaps Configurati](#zaps-configurati)
4. [Setup Zapier](#setup-zapier)
5. [Trigger e Azioni](#trigger-e-azioni)
6. [Testing](#testing)
7. [Monitoraggio](#monitoraggio)
8. [Troubleshooting](#troubleshooting)

---

## 📊 Panoramica

L'integrazione Zapier collega **MIO-hub** (repository GitHub) con **MIHUB** (backend API su Hetzner) per automatizzare:

- ✅ **Invocazione automatica di Abacus** quando MIO richiede elaborazioni
- ✅ **Logging automatico task** completati da MIO
- ✅ **Monitoraggio health** del backend MIHUB
- ✅ **Notifiche** su eventi critici

### Componenti

| Componente | Ruolo | URL/Repo |
|------------|-------|----------|
| **MIO-hub** | Repository centrale task/logs | github.com/Chcndr/MIO-hub |
| **MIHUB** | Backend API e database | 157.90.29.66 |
| **Zapier** | Orchestratore automazioni | zapier.com/app/zaps |
| **GitHub** | Source of truth e trigger | github.com |

---

## 🏗️ Architettura

### Flusso Principale: MIO → Abacus

```
┌─────────────┐
│   MIO GPT   │ (richiede elaborazione)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  GitHub repository_dispatch         │
│  Repo: Chcndr/MIO-hub               │
│  Event: invoke_abacus               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Zapier Zap                         │
│  Trigger: GitHub repository_dispatch│
│  Filter: event.action = invoke_abacus│
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Webhooks by Zapier                 │
│  POST http://157.90.29.66/api/abacus/invoke │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  MIHUB Backend                      │
│  Abacus esegue elaborazione         │
│  Risponde con risultato             │
└─────────────────────────────────────┘
```

### Flusso Secondario: Task Logging

```
┌─────────────┐
│   MIO GPT   │ (completa task)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Git commit su MIO-hub              │
│  Path: tasks/*.json                 │
│  Message: [task-complete] ...       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Zapier Zap                         │
│  Trigger: GitHub push               │
│  Filter: commit message contains    │
│          [task-complete]            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Webhooks by Zapier                 │
│  POST http://157.90.29.66/api/tasks/log │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  MIHUB Database                     │
│  Salva log task in mio_logs table   │
└─────────────────────────────────────┘
```

---

## ⚡ Zaps Configurati

### 1. MIO-hub GitHub Dispatch Handler

**Scopo**: Invocare Abacus automaticamente quando MIO lo richiede

**Configurazione**:
- **Trigger**: GitHub - Repository Dispatch
  - Repository: `Chcndr/MIO-hub`
  - Event types: `invoke_abacus`, `deploy_task`, `run_script`
  - Polling: ogni 2 minuti
- **Filter**: `event.action` equals `invoke_abacus`
- **Action**: Webhooks by Zapier - POST
  - URL: `http://157.90.29.66/api/abacus/invoke`
  - Headers: `Content-Type: application/json`, `X-Zapier-Source: MIO-hub`
  - Body: JSON con event_type, payload, repository, sender, timestamp

**Quando si attiva**:
- MIO crea un `repository_dispatch` event su GitHub
- Zapier riceve l'evento e lo filtra
- Se `action = invoke_abacus`, invia POST a MIHUB
- MIHUB esegue Abacus e risponde

**Esempio payload**:
```json
{
  "event_type": "invoke_abacus",
  "payload": {
    "task_id": "task-2025-11-18-001",
    "operation": "analyze_data",
    "data": { ... }
  },
  "repository": "Chcndr/MIO-hub",
  "sender": "MIO",
  "timestamp": "2025-11-18T16:00:00Z"
}
```

---

### 2. MIO-hub Task Logger

**Scopo**: Loggare automaticamente task completati da MIO

**Configurazione**:
- **Trigger**: GitHub - Push
  - Repository: `Chcndr/MIO-hub`
  - Branch: `master`
  - Path filter: `tasks/*.json`
  - Polling: ogni 5 minuti
- **Filter**: `head_commit.message` contains `[task-complete]`
- **Action**: Webhooks by Zapier - POST
  - URL: `http://157.90.29.66/api/tasks/log`
  - Headers: `Content-Type: application/json`, `X-Zapier-Source: MIO-hub`
  - Body: JSON con commit_sha, commit_message, author, files_modified, timestamp

**Quando si attiva**:
- MIO completa un task e fa commit con `[task-complete]` nel messaggio
- Zapier rileva il push e filtra per commit message
- Invia POST a MIHUB con dettagli del commit
- MIHUB salva il log nel database

**Esempio commit message**:
```
[task-complete] Analisi deployment Vercel completata

Task ID: task-2025-11-18-001
Duration: 45 minutes
Status: success
```

---

### 3. MIHUB Health Monitor

**Scopo**: Monitorare health endpoint MIHUB e notificare su errori

**Configurazione**:
- **Trigger**: Schedule by Zapier
  - Frequency: ogni 15 minuti
- **Action 1**: Webhooks by Zapier - GET
  - URL: `http://157.90.29.66/health`
- **Filter**: `status_code` not equals `200`
- **Action 2**: Webhooks by Zapier - POST (solo se filter passa)
  - URL: `http://157.90.29.66/api/alerts/health-check-failed`
  - Body: JSON con alert_type, service, timestamp, details

**Quando si attiva**:
- Ogni 15 minuti, Zapier fa GET su `/health`
- Se status code ≠ 200, invia alert a MIHUB
- MIHUB può loggare l'alert o inviare notifiche

---

## 🔧 Setup Zapier

### Prerequisiti

1. ✅ Account Zapier (già configurato: chcndr@gmail.com)
2. ✅ GitHub integration abilitata su Zapier
3. ✅ MIHUB backend operativo su 157.90.29.66
4. ✅ Repository MIO-hub accessibile

### Step 1: Creare Zap "MIO-hub GitHub Dispatch Handler"

1. Vai su https://zapier.com/app/zaps
2. Click **"Create"** → **"Zap"**
3. **Trigger**:
   - App: **GitHub**
   - Event: **Repository Dispatch** (se disponibile) o **Webhook** (catch hook)
   - Account: Seleziona account GitHub connesso
   - Repository: `Chcndr/MIO-hub`
   - Test trigger
4. **Filter** (opzionale):
   - Field: `event.action`
   - Condition: `Exactly matches`
   - Value: `invoke_abacus`
5. **Action**:
   - App: **Webhooks by Zapier**
   - Event: **POST**
   - URL: `http://157.90.29.66/api/abacus/invoke`
   - Payload Type: **JSON**
   - Data:
     ```json
     {
       "event_type": "{{trigger__event__action}}",
       "payload": "{{trigger__event__client_payload}}",
       "repository": "{{trigger__repository__full_name}}",
       "sender": "{{trigger__sender__login}}",
       "timestamp": "{{trigger__repository__pushed_at}}"
     }
     ```
   - Headers:
     - `Content-Type`: `application/json`
     - `X-Zapier-Source`: `MIO-hub`
6. **Test action**
7. **Publish Zap**
8. **Rename**: "MIO-hub GitHub Dispatch Handler"

### Step 2: Creare Zap "MIO-hub Task Logger"

1. **Trigger**:
   - App: **GitHub**
   - Event: **New Commit** (or **Push**)
   - Repository: `Chcndr/MIO-hub`
   - Branch: `master`
2. **Filter**:
   - Field: `head_commit__message`
   - Condition: `Contains`
   - Value: `[task-complete]`
3. **Action**:
   - App: **Webhooks by Zapier**
   - Event: **POST**
   - URL: `http://157.90.29.66/api/tasks/log`
   - Data:
     ```json
     {
       "commit_sha": "{{trigger__head_commit__id}}",
       "commit_message": "{{trigger__head_commit__message}}",
       "author": "{{trigger__head_commit__author__name}}",
       "files_modified": "{{trigger__head_commit__modified}}",
       "timestamp": "{{trigger__head_commit__timestamp}}"
     }
     ```
4. **Publish Zap**

### Step 3: Creare Zap "MIHUB Health Monitor"

1. **Trigger**:
   - App: **Schedule by Zapier**
   - Frequency: **Every 15 minutes**
2. **Action 1**:
   - App: **Webhooks by Zapier**
   - Event: **GET**
   - URL: `http://157.90.29.66/health`
3. **Filter**:
   - Field: `status_code`
   - Condition: `Does not exactly match`
   - Value: `200`
4. **Action 2**:
   - App: **Webhooks by Zapier**
   - Event: **POST**
   - URL: `http://157.90.29.66/api/alerts/health-check-failed`
   - Data:
     ```json
     {
       "alert_type": "health_check_failed",
       "service": "MIHUB",
       "timestamp": "{{zap_meta_human_now}}",
       "details": "Health endpoint returned non-200 status"
     }
     ```
5. **Publish Zap**

---

## 🎯 Trigger e Azioni

### Come MIO invoca Abacus tramite Zapier

**Opzione 1: GitHub repository_dispatch** (raccomandato)

MIO può usare GitHub CLI o API per creare un `repository_dispatch` event:

```bash
# Via GitHub CLI
gh api repos/Chcndr/MIO-hub/dispatches \
  -X POST \
  -f event_type='invoke_abacus' \
  -f client_payload='{"task_id":"task-001","operation":"analyze"}'
```

```bash
# Via curl
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Chcndr/MIO-hub/dispatches \
  -d '{"event_type":"invoke_abacus","client_payload":{"task_id":"task-001"}}'
```

**Opzione 2: Zapier Catch Hook** (alternativa)

Se `repository_dispatch` non è disponibile, usa Zapier Catch Hook:

1. Crea Zap con trigger **Webhooks by Zapier** → **Catch Hook**
2. Zapier fornisce URL webhook: `https://hooks.zapier.com/hooks/catch/[ID]/`
3. MIO invia POST a questo URL:

```bash
curl -X POST \
  https://hooks.zapier.com/hooks/catch/[YOUR_HOOK_ID]/ \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "invoke_abacus",
    "task_id": "task-001",
    "operation": "analyze",
    "data": { ... }
  }'
```

### Come MIO logga task completati

**Metodo: Git commit con tag `[task-complete]`**

```bash
cd /path/to/MIO-hub

# Salva task completato
echo '{"task_id":"task-001","status":"success"}' > tasks/task-001.json

# Commit con tag
git add tasks/task-001.json
git commit -m "[task-complete] Analisi deployment Vercel completata

Task ID: task-001
Duration: 45 minutes
Status: success"

# Push
git push origin master
```

Zapier rileverà il commit e loggerà automaticamente su MIHUB.

---

## 🧪 Testing

### Test 1: Trigger manuale repository_dispatch

```bash
# Test invocazione Abacus
gh api repos/Chcndr/MIO-hub/dispatches \
  -X POST \
  -f event_type='invoke_abacus' \
  -f client_payload='{"test":true,"task_id":"test-001"}'
```

**Verifica**:
1. Vai su https://zapier.com/app/history
2. Cerca Zap "MIO-hub GitHub Dispatch Handler"
3. Verifica che sia stato triggerato
4. Controlla log MIHUB: `curl http://157.90.29.66/api/abacus/logs`

### Test 2: Commit con [task-complete]

```bash
cd /home/ubuntu/MIO-hub

# Crea task di test
echo '{"test":true}' > tasks/test-task.json

# Commit con tag
git add tasks/test-task.json
git commit -m "[task-complete] Test task logging"
git push origin master
```

**Verifica**:
1. Zap History su Zapier
2. Log MIHUB: `curl http://157.90.29.66/api/tasks/log`

### Test 3: Health monitor

**Attendi 15 minuti** o forza esecuzione manuale:
1. Vai su Zapier Zap "MIHUB Health Monitor"
2. Click **"Run"** → **"Test & Review"**
3. Verifica che GET su `/health` ritorni 200

---

## 📊 Monitoraggio

### Zap History

**URL**: https://zapier.com/app/history

Mostra:
- ✅ Zaps eseguiti con successo
- ❌ Zaps falliti (con errore)
- ⏱️ Timestamp esecuzione
- 📄 Payload input/output

**Filtri utili**:
- Status: `Error` (solo falliti)
- Zap: Seleziona specifico Zap
- Date range: Ultimi 7 giorni

### MIHUB Logs

**Endpoint**: `http://157.90.29.66/api/logs`

```bash
# Vedi ultimi 50 log
curl http://157.90.29.66/api/logs?limit=50

# Filtra per source Zapier
curl http://157.90.29.66/api/logs?source=zapier

# Filtra per tipo evento
curl http://157.90.29.66/api/logs?event_type=invoke_abacus
```

### GitHub Actions (opzionale)

Se usi GitHub Actions, puoi loggare eventi Zapier:

```yaml
# .github/workflows/zapier-monitor.yml
name: Zapier Monitor
on:
  repository_dispatch:
    types: [invoke_abacus]
jobs:
  log:
    runs-on: ubuntu-latest
    steps:
      - name: Log event
        run: |
          echo "Zapier triggered: ${{ github.event.action }}"
          echo "Payload: ${{ toJson(github.event.client_payload) }}"
```

---

## 🔧 Troubleshooting

### Problema: Zap non si attiva

**Cause possibili**:
1. ❌ Zap disabilitato
2. ❌ Filter troppo restrittivo
3. ❌ Polling interval troppo lungo
4. ❌ GitHub integration non connessa

**Soluzione**:
```bash
# Verifica status Zap
# Vai su https://zapier.com/app/zaps
# Controlla che Zap sia "ON"

# Test manuale trigger
# Click "Test" nel Zap editor
```

### Problema: Webhook MIHUB fallisce

**Cause possibili**:
1. ❌ MIHUB backend down
2. ❌ Endpoint non esiste
3. ❌ Payload malformato
4. ❌ Firewall blocca Zapier IP

**Soluzione**:
```bash
# Verifica health MIHUB
curl http://157.90.29.66/health

# Verifica endpoint esiste
curl -X POST http://157.90.29.66/api/abacus/invoke \
  -H "Content-Type: application/json" \
  -d '{"test":true}'

# Controlla log MIHUB
ssh root@157.90.29.66
docker logs mihub-api
```

### Problema: Troppi task consumati

**Zapier limits**:
- Free: 100 tasks/mese
- Starter: 750 tasks/mese
- Professional: 2000 tasks/mese

**Soluzione**:
1. Aumenta polling interval (2min → 5min)
2. Aggiungi filter più restrittivi
3. Disabilita Zaps non essenziali
4. Upgrade piano Zapier

---

## 📝 Note Finali

### Variabili d'Ambiente

Le seguenti variabili sono usate nella configurazione:

```bash
MIHUB_BASE_URL=http://157.90.29.66
MIHUB_API_BASE=http://157.90.29.66/api
GITHUB_REPO_MIO_HUB=Chcndr/MIO-hub
ZAPIER_POLLING_INTERVAL=2m
```

### File di Configurazione

- **zapier-config.json**: Configurazione completa Zaps (`.github/zapier/`)
- **test-zapier-trigger.json**: Payload di test (`.github/zapier/`)
- **zapier-integration.md**: Questa documentazione (`docs/`)

### Prossimi Passi

1. ✅ Creare Zaps su Zapier seguendo setup sopra
2. ✅ Testare invocazione Abacus tramite repository_dispatch
3. ✅ Implementare endpoint `/api/abacus/invoke` su MIHUB
4. ✅ Implementare endpoint `/api/tasks/log` su MIHUB
5. ✅ Configurare API Guardian per gestire permessi

---

**Documentazione compilata**: 18 novembre 2025  
**Contatto**: Abacus via MIO-hub
