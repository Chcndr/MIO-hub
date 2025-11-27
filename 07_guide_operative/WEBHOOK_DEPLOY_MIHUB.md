# Guida Operativa: Deploy Automatico Backend MIHUB via Webhook GitHub

**Versione:** 1.0  
**Data:** 27 novembre 2025  
**Autore:** Manus AI  
**Repository:** `Chcndr/mihub-backend-rest`

---

## Panoramica

Questa guida descrive come attivare il sistema di deploy automatico del backend MIHUB da GitHub a Hetzner tramite webhook.

**Flusso operativo:**
1. Developer fa push su branch `master` del repository `mihub-backend-rest`
2. GitHub invia webhook POST a `https://mihub.157-90-29-66.nip.io/webhook/deploy-mihub`
3. Backend verifica firma HMAC del webhook
4. Se valida, esegue script `/root/scripts/deploy-mihub.sh` su Hetzner
5. Script: git pull + npm install (se necessario) + PM2 restart + health checks
6. Deploy viene loggato in Guardian logs (agent: `github`)

---

## Prerequisiti

- ✅ Accesso SSH al server Hetzner (157.90.29.66) come `root`
- ✅ Backend MIHUB già deployato in `/root/mihub-backend-rest`
- ✅ PM2 configurato con processo `mihub-backend`
- ✅ Accesso admin al repository GitHub `Chcndr/mihub-backend-rest`

---

## Step 1: Generare Secret Webhook

Sul server Hetzner, genera un secret casuale per proteggere l'endpoint webhook:

```bash
openssl rand -hex 32
```

**Output esempio:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

⚠️ **Salva questo secret in modo sicuro** (servirà per configurare GitHub e backend).

---

## Step 2: Configurare Backend MIHUB

### 2.1 Aggiungere Secret a `.env`

SSH su Hetzner e modifica il file `.env` del backend:

```bash
ssh root@157.90.29.66
cd /root/mihub-backend-rest
nano .env
```

Aggiungi la riga:

```env
GITHUB_WEBHOOK_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

(Sostituisci con il secret generato allo Step 1)

Salva e chiudi (`Ctrl+O`, `Enter`, `Ctrl+X`).

### 2.2 Verificare CORS

Assicurati che il file `.env` contenga anche:

```env
CORS_ORIGINS=https://mio-hub.me,https://www.mio-hub.me,https://dms-hub-app-new.vercel.app
```

Questo permette al frontend di chiamare il backend senza errori CORS.

### 2.3 Copiare Script Deploy

Copia lo script di deploy nella directory standard:

```bash
mkdir -p /root/scripts
cp /root/mihub-backend-rest/scripts/deploy-mihub.sh /root/scripts/
chmod +x /root/scripts/deploy-mihub.sh
```

Verifica che lo script sia eseguibile:

```bash
ls -la /root/scripts/deploy-mihub.sh
```

Output atteso:
```
-rwxr-xr-x 1 root root 1234 Nov 27 16:00 /root/scripts/deploy-mihub.sh
```

### 2.4 Restart Backend

Riavvia il backend per caricare il nuovo secret:

```bash
pm2 restart mihub-backend
pm2 save
```

Verifica che il processo sia attivo:

```bash
pm2 list | grep mihub-backend
```

Output atteso:
```
│ mihub-backend │ 0   │ online │ 1234 │ 0s │ 0% │ 123.4 MB │
```

---

## Step 3: Configurare Webhook GitHub

### 3.1 Accedere alle Impostazioni Repository

1. Vai su https://github.com/Chcndr/mihub-backend-rest
2. Clicca su **Settings** (tab in alto)
3. Nel menu laterale, clicca su **Webhooks**
4. Clicca su **Add webhook**

### 3.2 Configurare Webhook

Compila il form con i seguenti valori:

**Payload URL:**
```
https://mihub.157-90-29-66.nip.io/webhook/deploy-mihub
```

**Content type:**
```
application/json
```

**Secret:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```
(Usa lo stesso secret generato allo Step 1)

**Which events would you like to trigger this webhook?**
- Seleziona: **Just the `push` event**

**Active:**
- ✅ Spunta la checkbox

Clicca su **Add webhook**.

### 3.3 Verificare Configurazione

GitHub mostrerà il webhook appena creato nella lista. Clicca sul webhook per vedere i dettagli.

Nella sezione **Recent Deliveries** vedrai le richieste inviate (inizialmente vuota).

---

## Step 4: Test Deploy Manuale

### 4.1 Trigger Deploy da GitHub

Fai un commit di test sul branch `master`:

```bash
cd /path/to/local/mihub-backend-rest
echo "# Test deploy $(date)" >> README.md
git add README.md
git commit -m "test: Trigger webhook deploy"
git push origin master
```

### 4.2 Verificare Webhook GitHub

1. Torna su GitHub → Settings → Webhooks
2. Clicca sul webhook appena configurato
3. Scorri fino a **Recent Deliveries**
4. Dovresti vedere una richiesta POST con:
   - ✅ Status: **200 OK**
   - ✅ Response body: `{"success":true,"message":"Deploy started",...}`

Se vedi **401 Unauthorized**, il secret non corrisponde.  
Se vedi **500 Internal Server Error**, controlla i log backend su Hetzner.

### 4.3 Verificare Deploy su Hetzner

SSH su Hetzner e controlla i log PM2:

```bash
ssh root@157.90.29.66
pm2 logs mihub-backend --lines 50
```

Dovresti vedere:

```
[WEBHOOK] Deploy triggered: a1b2c3d by Your Name
=== MIHUB Backend Deploy Started ===
Pulling latest changes from GitHub...
...
=== Deploy Complete ===
```

### 4.4 Verificare Guardian Logs

Controlla che il deploy sia stato loggato:

```bash
curl -s https://mihub.157-90-29-66.nip.io/api/guardian/logs | grep github
```

Output atteso:

```json
{
  "agent": "github",
  "endpoint": "/webhook/deploy-mihub",
  "method": "POST",
  "success": true,
  "message": "Auto-deploy triggered: a1b2c3d by Your Name"
}
```

---

## Step 5: Test Locale Endpoint Webhook

### 5.1 Generare Firma HMAC

Per testare l'endpoint localmente, devi generare una firma HMAC valida.

**Script Node.js per generare firma:**

```javascript
// test-webhook-signature.js
const crypto = require('crypto');

const secret = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
const payload = JSON.stringify({
  ref: 'refs/heads/master',
  head_commit: {
    id: 'abc123def456',
    author: { name: 'Test User' }
  }
});

const hmac = crypto.createHmac('sha256', secret);
const signature = 'sha256=' + hmac.update(payload).digest('hex');

console.log('Payload:', payload);
console.log('Signature:', signature);
```

Esegui:

```bash
node test-webhook-signature.js
```

Output:

```
Payload: {"ref":"refs/heads/master","head_commit":{"id":"abc123def456","author":{"name":"Test User"}}}
Signature: sha256=f1e2d3c4b5a6...
```

### 5.2 Test con Firma Corretta

```bash
curl -X POST https://mihub.157-90-29-66.nip.io/webhook/deploy-mihub \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=f1e2d3c4b5a6..." \
  -d '{"ref":"refs/heads/master","head_commit":{"id":"abc123def456","author":{"name":"Test User"}}}'
```

**Risposta attesa (200 OK):**

```json
{
  "success": true,
  "message": "Deploy started",
  "commit": "abc123d",
  "author": "Test User",
  "timestamp": "2025-11-27T16:00:00.000Z"
}
```

### 5.3 Test con Firma Errata

```bash
curl -X POST https://mihub.157-90-29-66.nip.io/webhook/deploy-mihub \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=WRONG_SIGNATURE" \
  -d '{"ref":"refs/heads/master","head_commit":{"id":"abc123def456","author":{"name":"Test User"}}}'
```

**Risposta attesa (401 Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

### 5.4 Test con Branch Diverso da Master

```bash
curl -X POST https://mihub.157-90-29-66.nip.io/webhook/deploy-mihub \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=f1e2d3c4b5a6..." \
  -d '{"ref":"refs/heads/develop","head_commit":{"id":"abc123def456","author":{"name":"Test User"}}}'
```

**Risposta attesa (200 OK, ma deploy ignorato):**

```json
{
  "message": "Ignored: not a push to master"
}
```

---

## Step 6: Monitoraggio e Troubleshooting

### 6.1 Verificare Stato Webhook

Endpoint di status (non richiede autenticazione):

```bash
curl https://mihub.157-90-29-66.nip.io/webhook/status
```

Risposta:

```json
{
  "service": "MIHUB Deploy Webhook",
  "status": "active",
  "timestamp": "2025-11-27T16:00:00.000Z"
}
```

### 6.2 Log Backend su Hetzner

```bash
ssh root@157.90.29.66
pm2 logs mihub-backend --lines 100
```

Cerca righe tipo:

```
[WEBHOOK] Deploy triggered: a1b2c3d by Your Name
[DEPLOY SUCCESS] === Deploy Complete ===
```

### 6.3 Log Script Deploy

Lo script scrive su stdout, visibile nei log PM2. Per debug più dettagliato, modifica lo script per scrivere su file:

```bash
# In /root/scripts/deploy-mihub.sh, aggiungi all'inizio:
exec > >(tee -a /root/logs/deploy-mihub.log)
exec 2>&1
```

Poi controlla:

```bash
tail -f /root/logs/deploy-mihub.log
```

### 6.4 Guardian Logs

Dashboard PA → MIO Agent → Attività Agenti Recente (Guardian)

Cerca eventi con:
- **Agent:** `github`
- **Endpoint:** `/webhook/deploy-mihub`
- **Method:** `POST`
- **Success:** `true`

### 6.5 Problemi Comuni

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| **401 Unauthorized** | Secret webhook non corrisponde | Verifica che `GITHUB_WEBHOOK_SECRET` in `.env` sia uguale al secret GitHub |
| **500 Internal Server Error** | Script deploy fallito | Controlla log PM2: `pm2 logs mihub-backend` |
| **Deploy non parte** | Script non eseguibile | `chmod +x /root/scripts/deploy-mihub.sh` |
| **Health check fallito** | Backend non risponde dopo restart | Verifica `pm2 list` e log applicazione |
| **Guardian log mancante** | Database non raggiungibile | Verifica `DATABASE_URL` in `.env` |

---

## Step 7: Disattivare Webhook (Opzionale)

Se serve disattivare temporaneamente il deploy automatico:

### 7.1 Da GitHub

1. GitHub → Settings → Webhooks
2. Clicca sul webhook
3. Scorri in fondo e clicca **Delete webhook**

### 7.2 Da Backend

Rimuovi o commenta il secret in `.env`:

```env
# GITHUB_WEBHOOK_SECRET=...
```

Restart backend:

```bash
pm2 restart mihub-backend
```

L'endpoint resterà attivo ma rifiuterà tutte le richieste (401 Unauthorized).

---

## Checklist Attivazione

- [ ] Secret webhook generato (`openssl rand -hex 32`)
- [ ] Secret aggiunto a `/root/mihub-backend-rest/.env`
- [ ] CORS configurato con `mio-hub.me` e `www.mio-hub.me`
- [ ] Script deploy copiato in `/root/scripts/deploy-mihub.sh`
- [ ] Script reso eseguibile (`chmod +x`)
- [ ] Backend riavviato (`pm2 restart mihub-backend`)
- [ ] Webhook GitHub configurato con URL e secret corretti
- [ ] Test deploy manuale eseguito con successo
- [ ] Guardian logs verificati (agent: `github`)
- [ ] Health checks endpoint passati (markets, stalls, vendors)

---

## Riferimenti

- **Repository Backend:** https://github.com/Chcndr/mihub-backend-rest
- **Endpoint Webhook:** `POST /webhook/deploy-mihub`
- **Script Deploy:** `/root/scripts/deploy-mihub.sh`
- **Guardian Logs:** Dashboard PA → MIO Agent → Attività Agenti Recente
- **Documentazione GitHub Webhooks:** https://docs.github.com/en/webhooks

---

## Note per MIO Orchestratore

Quando MIO deve triggerare un deploy manuale (senza push GitHub), può usare:

```bash
# Via Manus (con firma HMAC corretta)
curl -X POST https://mihub.157-90-29-66.nip.io/webhook/deploy-mihub \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: $(generate_hmac_signature)" \
  -d '{"ref":"refs/heads/master","head_commit":{"id":"manual","author":{"name":"MIO Orchestrator"}}}'
```

Oppure eseguire direttamente lo script su Hetzner:

```bash
# Via SSH (richiede credenziali)
ssh root@157.90.29.66 /root/scripts/deploy-mihub.sh
```

**Raccomandazione:** Preferire webhook GitHub per tracciabilità completa nei Guardian logs.

---

**Fine Guida Operativa**
