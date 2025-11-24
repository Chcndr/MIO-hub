# Collegamento Frontend → Backend Hetzner

**Versione**: 1.0.0  
**Data**: 18 novembre 2025  
**Progetto**: dms-hub-app-new (Frontend Vercel) → MIHUB (Backend Hetzner)

---

## 📋 Panoramica

Il frontend **dms-hub-app-new** su Vercel deve connettersi al backend **MIHUB** su Hetzner per:

- ✅ **API tRPC**: Chiamate procedure backend
- ✅ **Database**: Accesso dati tramite backend
- ✅ **Autenticazione**: Login/logout utenti
- ✅ **Servizi**: GEO, Shop, MIO Agent, etc.

---

## 🔧 Configurazione Attuale

### Frontend (dms-hub-app-new)

**File**: `client/src/main.tsx`

```typescript
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",  // ← URL RELATIVO (usa stesso dominio frontend)
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
```

**Problema**: 
- ❌ URL relativo `/api/trpc` punta al **frontend Vercel**, non al backend Hetzner
- ❌ Vercel frontend non ha backend tRPC (è solo static/SSR)
- ❌ Backend MIHUB su Hetzner non è raggiungibile

### Backend (MIHUB Hetzner)

**Endpoint tRPC**: `http://157.90.29.66/trpc/`  
**Endpoint API**: `http://157.90.29.66/api/`  
**Health Check**: `http://157.90.29.66/health`

**Status**: ✅ Operativo e raggiungibile

---

## ✅ Soluzione: Variabile d'Ambiente

### Step 1: Definire Variabile d'Ambiente

**Nome**: `VITE_TRPC_URL`

**Valori**:
- **Development** (locale): `http://localhost:3000/api/trpc`
- **Production** (Vercel → Hetzner): `http://157.90.29.66/trpc`

### Step 2: Aggiornare Codice Frontend

**File**: `client/src/main.tsx`

**Prima** (URL relativo):
```typescript
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",  // ← Relativo
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
```

**Dopo** (URL da variabile d'ambiente):
```typescript
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_TRPC_URL || "/api/trpc",  // ← Da env
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
```

### Step 3: Configurare Variabili d'Ambiente

#### Locale (.env.local)

**File**: `/home/ubuntu/dms-hub-app-new/.env.local`

```bash
# Backend tRPC URL (development)
VITE_TRPC_URL=http://localhost:3000/api/trpc

# Database
DATABASE_URL=mysql://root:Ux2xndvqr0YnbhxBqRqVKwPqv1empIZti@yamanote.proxy.rlwy.net:51481/railway
```

#### Production (Vercel Environment Variables)

**Dashboard Vercel** → **Settings** → **Environment Variables**

| Nome | Valore | Environments |
|------|--------|--------------|
| `VITE_TRPC_URL` | `http://157.90.29.66/trpc` | Production, Preview, Development |
| `DATABASE_URL` | `mysql://root:nTETIMEDhbZsxVOpxDcdoBmgSaGvlWPz@crossover.proxy.rlwy.net:49968/railway` | Production |

**Note**:
- ✅ `VITE_` prefix è necessario per Vite (espone variabile al client)
- ✅ Applica a **Production, Preview, Development**
- ⚠️ **NON usare HTTPS** per ora (backend Hetzner è HTTP)

### Step 4: Aggiornare .env.example

**File**: `/home/ubuntu/dms-hub-app-new/.env.example`

```bash
# Backend tRPC URL
# Development: http://localhost:3000/api/trpc
# Production: http://157.90.29.66/trpc
VITE_TRPC_URL=http://localhost:3000/api/trpc

# Database Configuration
# Copy this file to .env.local for local development
# Add DATABASE_URL to Vercel Environment Variables for production
DATABASE_URL=mysql://root:Ux2xndvqr0YnbhxBqRqVKwPqv1empIZti@yamanote.proxy.rlwy.net:51481/railway
```

---

## 🔄 Flusso Completo

### Development (Locale)

```
┌──────────────────┐
│  Browser         │
│  localhost:5173  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Vite Dev Server                 │
│  localhost:5173                  │
│  VITE_TRPC_URL=localhost:3000/api/trpc │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Backend Locale                  │
│  localhost:3000/api/trpc         │
│  (server/_core/index.ts)         │
└──────────────────────────────────┘
```

### Production (Vercel → Hetzner)

```
┌──────────────────┐
│  Browser         │
│  User            │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Vercel Frontend                 │
│  dms-hub-app-new.vercel.app      │
│  VITE_TRPC_URL=157.90.29.66/trpc │
└────────┬─────────────────────────┘
         │ HTTP Request
         ▼
┌──────────────────────────────────┐
│  Hetzner Backend (MIHUB)         │
│  157.90.29.66/trpc               │
│  Docker + Nginx                  │
└──────────────────────────────────┘
```

---

## 🚀 Deployment Checklist

### Prima del Deployment

- [ ] Aggiornare `client/src/main.tsx` con `import.meta.env.VITE_TRPC_URL`
- [ ] Aggiornare `.env.example` con `VITE_TRPC_URL`
- [ ] Commit e push su GitHub
- [ ] Attendere risoluzione GitHub outage

### Dopo Risoluzione GitHub Outage

1. **Configurare Variabile d'Ambiente su Vercel**:
   - Vai su https://vercel.com/andreas-projects-a6e30e41/dms-hub-app-new/settings/environment-variables
   - Click **"Add New"**
   - Nome: `VITE_TRPC_URL`
   - Value: `http://157.90.29.66/trpc`
   - Environments: **Production**, **Preview**, **Development**
   - Click **"Save"**

2. **Triggerare Nuovo Deployment**:
   - **Opzione A** (automatico): Push nuovo commit su master
   - **Opzione B** (manuale): Vercel Dashboard → Deployments → Redeploy

3. **Verificare Deployment**:
   ```bash
   # Verifica che variabile sia impostata
   curl https://dms-hub-app-new.vercel.app/_vercel/env
   
   # Verifica che frontend carichi
   curl https://dms-hub-app-new.vercel.app
   ```

4. **Testare Connessione Frontend → Backend**:
   - Apri https://dms-hub-app-new.vercel.app
   - Apri DevTools → Network
   - Verifica che richieste tRPC vadano a `http://157.90.29.66/trpc`
   - Verifica che risposte siano 200 OK

---

## 🧪 Testing

### Test 1: Variabile d'Ambiente Locale

```bash
cd /home/ubuntu/dms-hub-app-new

# Verifica .env.local
cat .env.local | grep VITE_TRPC_URL

# Dovrebbe mostrare:
# VITE_TRPC_URL=http://localhost:3000/api/trpc
```

### Test 2: Build Locale

```bash
cd /home/ubuntu/dms-hub-app-new

# Build frontend
pnpm run build

# Verifica che variabile sia stata sostituita
grep -r "157.90.29.66" dist/ || echo "Variabile non hardcoded (OK)"
```

### Test 3: Backend Hetzner Raggiungibile

```bash
# Health check
curl http://157.90.29.66/health

# Dovrebbe rispondere:
# {"status":"ok","timestamp":"2025-11-18T..."}

# tRPC endpoint
curl http://157.90.29.66/trpc/

# Dovrebbe rispondere con lista procedure tRPC
```

### Test 4: CORS Headers

```bash
# Verifica CORS headers
curl -X OPTIONS http://157.90.29.66/trpc \
  -H "Origin: https://dms-hub-app-new.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Dovrebbe mostrare:
# Access-Control-Allow-Origin: https://dms-hub-app-new.vercel.app
# Access-Control-Allow-Methods: GET, POST, OPTIONS
# Access-Control-Allow-Credentials: true
```

**Se CORS fallisce**, aggiornare backend MIHUB:

**File**: `server/_core/index.ts`

```typescript
app.use(cors({
  origin: [
    'https://dms-hub-app-new.vercel.app',
    'http://localhost:5173',
  ],
  credentials: true,
}));
```

---

## ⚠️ Problemi Comuni

### Problema 1: CORS Error

**Sintomo**:
```
Access to fetch at 'http://157.90.29.66/trpc' from origin 'https://dms-hub-app-new.vercel.app' 
has been blocked by CORS policy
```

**Causa**: Backend non ha CORS configurato per dominio Vercel

**Soluzione**:
```typescript
// server/_core/index.ts
app.use(cors({
  origin: 'https://dms-hub-app-new.vercel.app',
  credentials: true,
}));
```

### Problema 2: Mixed Content (HTTP su HTTPS)

**Sintomo**:
```
Mixed Content: The page at 'https://dms-hub-app-new.vercel.app' was loaded over HTTPS, 
but requested an insecure resource 'http://157.90.29.66/trpc'
```

**Causa**: Frontend HTTPS chiama backend HTTP

**Soluzione**:
1. **Opzione A** (raccomandato): Configurare HTTPS su backend Hetzner con Let's Encrypt
2. **Opzione B** (temporaneo): Usare proxy Vercel (vedi sotto)

### Problema 3: Variabile d'Ambiente Non Caricata

**Sintomo**: Frontend usa `/api/trpc` invece di `http://157.90.29.66/trpc`

**Causa**: Variabile `VITE_TRPC_URL` non impostata su Vercel

**Soluzione**:
1. Vercel Dashboard → Settings → Environment Variables
2. Aggiungi `VITE_TRPC_URL=http://157.90.29.66/trpc`
3. Redeploy

---

## 🔒 Soluzione HTTPS (Opzionale)

### Opzione 1: Nginx + Let's Encrypt su Hetzner

**Vantaggi**:
- ✅ HTTPS nativo
- ✅ Certificato gratuito
- ✅ Rinnovo automatico

**Setup**:
```bash
# SSH su Hetzner
ssh root@157.90.29.66

# Installa Certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Ottieni certificato (richiede dominio)
certbot --nginx -d api.dms-hub.com

# Nginx configurerà automaticamente HTTPS
```

**Aggiorna variabile Vercel**:
```
VITE_TRPC_URL=https://api.dms-hub.com/trpc
```

### Opzione 2: Vercel Proxy (Temporaneo)

**File**: `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/trpc/:path*",
      "destination": "http://157.90.29.66/trpc/:path*"
    }
  ]
}
```

**Vantaggi**:
- ✅ Nessuna modifica backend
- ✅ HTTPS automatico (tramite Vercel)

**Svantaggi**:
- ❌ Latenza extra (Vercel → Hetzner)
- ❌ Limiti Vercel su proxy

---

## 📊 Riepilogo Configurazione

### Variabili d'Ambiente

| Nome | Valore Development | Valore Production | Dove |
|------|-------------------|-------------------|------|
| `VITE_TRPC_URL` | `http://localhost:3000/api/trpc` | `http://157.90.29.66/trpc` | Frontend |
| `DATABASE_URL` | `mysql://...yamanote.proxy.rlwy.net:51481/railway` | `mysql://...crossover.proxy.rlwy.net:49968/railway` | Backend |

### Endpoint Backend

| Servizio | URL | Metodo | Descrizione |
|----------|-----|--------|-------------|
| **Health** | `http://157.90.29.66/health` | GET | Status backend |
| **tRPC** | `http://157.90.29.66/trpc` | POST | Procedure tRPC |
| **API** | `http://157.90.29.66/api/*` | * | REST API (se presente) |

### File da Modificare

| File | Modifica | Stato |
|------|----------|-------|
| `client/src/main.tsx` | Aggiungere `import.meta.env.VITE_TRPC_URL` | ⏳ Da fare |
| `.env.example` | Aggiungere `VITE_TRPC_URL` | ⏳ Da fare |
| `.env.local` | Aggiungere `VITE_TRPC_URL` (development) | ⏳ Da fare |
| Vercel Env Vars | Aggiungere `VITE_TRPC_URL` (production) | ⏳ Da fare dopo GitHub outage |

---

## 📝 Checklist Post-Deployment

Dopo il deployment su Vercel:

- [ ] Frontend carica correttamente (https://dms-hub-app-new.vercel.app)
- [ ] Richieste tRPC vanno a `http://157.90.29.66/trpc` (verifica Network tab)
- [ ] Risposte tRPC sono 200 OK
- [ ] Login funziona
- [ ] Dati caricano correttamente
- [ ] Nessun errore CORS in console
- [ ] Nessun errore Mixed Content

---

## 🔗 Link Utili

- **Frontend Production**: https://dms-hub-app-new.vercel.app
- **Backend Health**: http://157.90.29.66/health
- **Backend tRPC**: http://157.90.29.66/trpc
- **Vercel Dashboard**: https://vercel.com/andreas-projects-a6e30e41/dms-hub-app-new
- **Vercel Env Vars**: https://vercel.com/andreas-projects-a6e30e41/dms-hub-app-new/settings/environment-variables

---

**Documentazione compilata**: 18 novembre 2025  
**Prossimo step**: Attendere risoluzione GitHub outage, poi deployment
