# API Guardian - Gestione Centralizzata API

**Versione**: 1.0.0  
**Data**: 18 novembre 2025  
**Autore**: Abacus (Manus AI)

---

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Configurazione](#configurazione)
4. [Endpoint Gestiti](#endpoint-gestiti)
5. [Autenticazione](#autenticazione)
6. [Rate Limiting](#rate-limiting)
7. [Logging](#logging)
8. [Monitoraggio](#monitoraggio)
9. [Implementazione](#implementazione)
10. [Esempi](#esempi)

---

## 📊 Panoramica

**API Guardian** è un sistema di gestione centralizzata per tutti gli endpoint API di MIO-hub e MIHUB.

### Obiettivi

- ✅ **Controllo centralizzato** di tutti gli endpoint
- ✅ **Autenticazione e autorizzazione** granulare
- ✅ **Rate limiting** per prevenire abusi
- ✅ **Logging completo** di richieste e risposte
- ✅ **Monitoraggio** performance e errori
- ✅ **CORS** configurabile per endpoint
- ✅ **Validazione** payload automatica

### Componenti

| Componente | Ruolo | File |
|------------|-------|------|
| **Config JSON** | Configurazione centralizzata | `system/api-guardian-config.json` |
| **Middleware** | Implementazione Express | `server/_core/api-guardian.ts` (da creare) |
| **Logger** | Logging richieste/risposte | `logs/api-guardian.log` |
| **Monitor** | Metriche e alert | Dashboard (da implementare) |

---

## 🏗️ Architettura

### Flusso Richiesta

```
┌─────────────────┐
│  Client         │ (Browser, Zapier, MIO)
└────────┬────────┘
         │ HTTP Request
         ▼
┌─────────────────────────────────────┐
│  API Guardian Middleware            │
│  ┌───────────────────────────────┐  │
│  │ 1. Parse Request              │  │
│  │ 2. Check Auth                 │  │
│  │ 3. Check Rate Limit           │  │
│  │ 4. Validate Payload           │  │
│  │ 5. Check CORS                 │  │
│  │ 6. Log Request                │  │
│  └───────────────────────────────┘  │
└────────┬────────────────────────────┘
         │ Allowed
         ▼
┌─────────────────────────────────────┐
│  Backend Handler                    │
│  (tRPC, Express route, etc.)        │
└────────┬────────────────────────────┘
         │ Response
         ▼
┌─────────────────────────────────────┐
│  API Guardian Middleware            │
│  ┌───────────────────────────────┐  │
│  │ 7. Log Response               │  │
│  │ 8. Add Security Headers       │  │
│  │ 9. Track Metrics              │  │
│  └───────────────────────────────┘  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Client         │ (riceve risposta)
└─────────────────┘
```

### Layers

**Layer 1: Configuration** (JSON)
- Definisce endpoint, permessi, rate limit
- Letto all'avvio del server
- Hot-reload su modifica

**Layer 2: Middleware** (Express)
- Applica regole da config
- Intercetta tutte le richieste
- Valida, autentica, logga

**Layer 3: Logging** (File + Database)
- Salva log richieste/risposte
- Maschera dati sensibili
- Rotazione automatica

**Layer 4: Monitoring** (Metrics + Alerts)
- Traccia performance
- Rileva anomalie
- Invia alert

---

## 🔧 Configurazione

### File Principale

**Path**: `/home/ubuntu/MIO-hub/system/api-guardian-config.json`

**Struttura**:
```json
{
  "version": "1.0.0",
  "services": { ... },
  "endpoints": { ... },
  "auth": { ... },
  "rate_limiting": { ... },
  "logging": { ... },
  "monitoring": { ... },
  "cors": { ... },
  "security": { ... }
}
```

### Servizi

Definisce i servizi backend gestiti:

```json
{
  "services": {
    "mihub": {
      "name": "MIHUB Backend",
      "base_url": "http://157.90.29.66",
      "status": "active",
      "health_endpoint": "/health",
      "health_check_interval": "5m"
    }
  }
}
```

### Endpoint

Definisce ogni endpoint con regole specifiche:

```json
{
  "endpoints": {
    "abacus_invoke": {
      "service": "mihub",
      "path": "/api/abacus/invoke",
      "method": "POST",
      "auth_required": true,
      "auth_type": "api_key",
      "rate_limit": {
        "enabled": true,
        "max_requests": 10,
        "window": "1m"
      },
      "allowed_sources": ["zapier", "mio", "admin"],
      "log_requests": true,
      "log_responses": true,
      "validation": {
        "required_fields": ["event_type", "payload"]
      }
    }
  }
}
```

---

## 🔐 Autenticazione

### Tipi Supportati

**1. API Key** (per servizi esterni)

```bash
curl -X POST http://157.90.29.66/api/abacus/invoke \
  -H "X-API-Key: zap_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"invoke_abacus","payload":{}}'
```

**Config**:
```json
{
  "auth": {
    "api_key": {
      "header_name": "X-API-Key",
      "sources": {
        "zapier": {
          "enabled": true,
          "key_prefix": "zap_",
          "permissions": ["abacus_invoke", "tasks_log"]
        }
      }
    }
  }
}
```

**2. Session** (per utenti frontend)

```javascript
// Frontend usa cookie session
fetch('http://157.90.29.66/api/mio/query', {
  method: 'POST',
  credentials: 'include',  // Invia cookie
  body: JSON.stringify({ query: '...' })
});
```

**Config**:
```json
{
  "auth": {
    "session": {
      "cookie_name": "dms_session",
      "max_age": "7d",
      "secure": true,
      "http_only": true
    }
  }
}
```

### Permessi

Ogni source (zapier, mio, admin) ha permessi specifici:

| Source | Prefix | Permessi |
|--------|--------|----------|
| **zapier** | `zap_` | `abacus_invoke`, `tasks_log`, `alerts_health_failed` |
| **mio** | `mio_` | `abacus_invoke`, `tasks_log`, `mio_agent_query` |
| **admin** | `adm_` | `*` (tutti) |

**Esempio verifica permessi**:
```typescript
function hasPermission(apiKey: string, endpoint: string): boolean {
  const source = getSourceFromApiKey(apiKey);
  const permissions = config.auth.api_key.sources[source].permissions;
  return permissions.includes(endpoint) || permissions.includes('*');
}
```

---

## ⏱️ Rate Limiting

### Livelli

**1. Global** (tutto il server)
```json
{
  "rate_limiting": {
    "global": {
      "enabled": true,
      "max_requests": 1000,
      "window": "1h"
    }
  }
}
```

**2. Per Endpoint**
```json
{
  "endpoints": {
    "abacus_invoke": {
      "rate_limit": {
        "enabled": true,
        "max_requests": 10,
        "window": "1m"
      }
    }
  }
}
```

**3. Per User/Source**
```json
{
  "rate_limiting": {
    "per_user": {
      "enabled": true,
      "max_requests": 100,
      "window": "1m"
    }
  }
}
```

### Strategia

**Sliding Window** (raccomandato):
- Conta richieste negli ultimi N minuti
- Più preciso di fixed window
- Previene burst attacks

**Implementazione**:
```typescript
function checkRateLimit(key: string, limit: number, window: number): boolean {
  const now = Date.now();
  const windowStart = now - window;
  
  // Rimuovi richieste vecchie
  const requests = getRequests(key).filter(t => t > windowStart);
  
  // Verifica limite
  if (requests.length >= limit) {
    return false;  // Rate limit exceeded
  }
  
  // Aggiungi nuova richiesta
  addRequest(key, now);
  return true;
}
```

### Response Headers

Quando rate limit è attivo, aggiungi headers:

```
X-Rate-Limit-Limit: 10
X-Rate-Limit-Remaining: 7
X-Rate-Limit-Reset: 1700000000
```

---

## 📝 Logging

### Destinazioni

**1. Database** (per query e analytics)
```json
{
  "logging": {
    "destinations": [
      {
        "type": "database",
        "table": "api_logs",
        "fields": [
          "timestamp",
          "endpoint",
          "method",
          "source",
          "status_code",
          "response_time",
          "error"
        ]
      }
    ]
  }
}
```

**Schema tabella**:
```sql
CREATE TABLE api_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  timestamp DATETIME NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  source VARCHAR(50),
  status_code INT,
  response_time INT,  -- milliseconds
  error TEXT,
  request_body JSON,
  response_body JSON,
  INDEX idx_timestamp (timestamp),
  INDEX idx_endpoint (endpoint),
  INDEX idx_source (source)
);
```

**2. File** (per debugging e backup)
```json
{
  "logging": {
    "destinations": [
      {
        "type": "file",
        "path": "/home/ubuntu/MIO-hub/logs/api-guardian.log",
        "rotation": "daily",
        "max_size": "100MB",
        "max_files": 30
      }
    ]
  }
}
```

**Formato log**:
```
[2025-11-18T16:00:00.000Z] INFO POST /api/abacus/invoke source=zapier status=200 time=123ms
[2025-11-18T16:00:01.000Z] ERROR POST /api/tasks/log source=mio status=500 time=45ms error="Database connection failed"
```

### Mascheramento Dati Sensibili

```json
{
  "logging": {
    "sensitive_fields": [
      "password",
      "api_key",
      "token",
      "secret"
    ],
    "mask_sensitive": true
  }
}
```

**Prima**:
```json
{
  "email": "user@example.com",
  "password": "mypassword123",
  "api_key": "zap_abc123xyz"
}
```

**Dopo mascheramento**:
```json
{
  "email": "user@example.com",
  "password": "***MASKED***",
  "api_key": "***MASKED***"
}
```

---

## 📊 Monitoraggio

### Metriche

**1. Request Count** (counter)
```json
{
  "name": "request_count",
  "type": "counter",
  "labels": ["endpoint", "method", "status"]
}
```

**Query Prometheus**:
```promql
# Totale richieste
sum(request_count)

# Richieste per endpoint
sum by (endpoint) (request_count)

# Errori 5xx
sum(request_count{status=~"5.."})
```

**2. Request Duration** (histogram)
```json
{
  "name": "request_duration",
  "type": "histogram",
  "labels": ["endpoint", "method"],
  "buckets": [0.01, 0.05, 0.1, 0.5, 1, 5]
}
```

**Query**:
```promql
# P95 latency
histogram_quantile(0.95, request_duration)

# Avg latency per endpoint
avg by (endpoint) (request_duration)
```

**3. Error Rate** (gauge)
```json
{
  "name": "error_rate",
  "type": "gauge",
  "labels": ["endpoint", "error_type"]
}
```

### Alert

**1. High Error Rate**
```json
{
  "name": "high_error_rate",
  "condition": "error_rate > 0.1",
  "window": "5m",
  "action": "notify_admin"
}
```

**Implementazione**:
```typescript
function checkAlert(metric: string, condition: string, window: string) {
  const value = getMetricValue(metric, window);
  if (eval(condition.replace(metric, value))) {
    triggerAlert(metric, value);
  }
}
```

**2. Rate Limit Exceeded**
```json
{
  "name": "rate_limit_exceeded",
  "condition": "rate_limit_hits > 10",
  "window": "1m",
  "action": "log_warning"
}
```

---

## 🔨 Implementazione

### Step 1: Creare Middleware

**File**: `server/_core/api-guardian.ts`

```typescript
import express from 'express';
import fs from 'fs';

// Carica config
const config = JSON.parse(
  fs.readFileSync('/home/ubuntu/MIO-hub/system/api-guardian-config.json', 'utf8')
);

export function apiGuardianMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const startTime = Date.now();
  
  // 1. Trova endpoint config
  const endpointConfig = findEndpointConfig(req.path, req.method);
  if (!endpointConfig) {
    return next();  // Endpoint non gestito da Guardian
  }
  
  // 2. Check auth
  if (endpointConfig.auth_required) {
    const authResult = checkAuth(req, endpointConfig.auth_type);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = authResult.user;
  }
  
  // 3. Check rate limit
  if (endpointConfig.rate_limit?.enabled) {
    const rateLimitOk = checkRateLimit(
      req.user?.id || req.ip,
      endpointConfig.rate_limit.max_requests,
      endpointConfig.rate_limit.window
    );
    if (!rateLimitOk) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
  }
  
  // 4. Validate payload
  if (endpointConfig.validation) {
    const validationResult = validatePayload(req.body, endpointConfig.validation);
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error });
    }
  }
  
  // 5. Log request
  if (endpointConfig.log_requests) {
    logRequest(req, endpointConfig);
  }
  
  // 6. Intercept response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    if (endpointConfig.log_responses) {
      logResponse(req, res, data, responseTime);
    }
    
    // Track metrics
    trackMetrics(endpointConfig, res.statusCode, responseTime);
    
    return originalSend.call(this, data);
  };
  
  next();
}

function findEndpointConfig(path: string, method: string) {
  for (const [key, endpoint] of Object.entries(config.endpoints)) {
    if (endpoint.path === path && endpoint.method === method) {
      return endpoint;
    }
  }
  return null;
}

function checkAuth(req: express.Request, authType: string) {
  if (authType === 'api_key') {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return { success: false };
    }
    
    // Verifica API key
    const source = getSourceFromApiKey(apiKey);
    if (!source) {
      return { success: false };
    }
    
    return { success: true, user: { source, apiKey } };
  }
  
  if (authType === 'session') {
    const session = req.cookies[config.auth.session.cookie_name];
    if (!session) {
      return { success: false };
    }
    
    // Verifica session
    const user = getUserFromSession(session);
    if (!user) {
      return { success: false };
    }
    
    return { success: true, user };
  }
  
  return { success: false };
}

function checkRateLimit(key: string, maxRequests: number, window: string): boolean {
  // Implementa sliding window rate limiting
  const windowMs = parseWindow(window);
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // ... (vedi sezione Rate Limiting sopra)
  
  return true;
}

function validatePayload(body: any, validation: any): { valid: boolean; error?: string } {
  // Verifica required fields
  for (const field of validation.required_fields || []) {
    if (!(field in body)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  return { valid: true };
}

function logRequest(req: express.Request, endpointConfig: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    endpoint: req.path,
    method: req.method,
    source: req.user?.source || 'unknown',
    request_body: maskSensitive(req.body)
  };
  
  // Log to file
  fs.appendFileSync(
    '/home/ubuntu/MIO-hub/logs/api-guardian.log',
    JSON.stringify(logEntry) + '\n'
  );
  
  // Log to database (async)
  saveToDatabase('api_logs', logEntry).catch(console.error);
}

function maskSensitive(obj: any): any {
  const masked = { ...obj };
  for (const field of config.logging.sensitive_fields) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }
  return masked;
}
```

### Step 2: Integrare nel Server

**File**: `server/_core/index.ts`

```typescript
import { apiGuardianMiddleware } from './api-guardian';

// ... setup Express app

// Applica API Guardian a tutte le route
app.use(apiGuardianMiddleware);

// ... altre middleware e route
```

### Step 3: Testare

```bash
# Test endpoint senza auth (dovrebbe fallire)
curl -X POST http://157.90.29.66/api/abacus/invoke \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test"}'

# Risposta:
# {"error":"Unauthorized"}

# Test con API key
curl -X POST http://157.90.29.66/api/abacus/invoke \
  -H "X-API-Key: zap_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","payload":{}}'

# Risposta:
# {"status":"ok","result":"..."}

# Verifica log
tail -f /home/ubuntu/MIO-hub/logs/api-guardian.log
```

---

## 📚 Esempi

### Esempio 1: Zapier Invoca Abacus

**Request**:
```bash
curl -X POST http://157.90.29.66/api/abacus/invoke \
  -H "X-API-Key: zap_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "invoke_abacus",
    "payload": {
      "task_id": "task-001",
      "operation": "analyze_deployment"
    },
    "repository": "Chcndr/MIO-hub",
    "sender": "zapier",
    "timestamp": "2025-11-18T16:00:00Z"
  }'
```

**API Guardian Flow**:
1. ✅ Trova endpoint config `abacus_invoke`
2. ✅ Verifica API key `zap_abc123xyz` (source: zapier)
3. ✅ Verifica permessi zapier (ha `abacus_invoke`)
4. ✅ Verifica rate limit (10 req/min, ok)
5. ✅ Valida payload (required: event_type, payload)
6. ✅ Logga request
7. ✅ Passa a backend handler
8. ✅ Logga response
9. ✅ Traccia metrics

**Response**:
```json
{
  "status": "ok",
  "task_id": "task-001",
  "result": "Abacus invoked successfully"
}
```

### Esempio 2: MIO Logga Task

**Request**:
```bash
curl -X POST http://157.90.29.66/api/tasks/log \
  -H "X-API-Key: mio_xyz789abc" \
  -H "Content-Type: application/json" \
  -d '{
    "commit_sha": "65a9cb6",
    "commit_message": "[task-complete] Deployment analysis",
    "author": "MIO",
    "files_modified": ["tasks/task-001.json"],
    "timestamp": "2025-11-18T16:00:00Z"
  }'
```

**API Guardian Flow**:
1. ✅ Trova endpoint config `tasks_log`
2. ✅ Verifica API key `mio_xyz789abc` (source: mio)
3. ✅ Verifica permessi mio (ha `tasks_log`)
4. ✅ Verifica rate limit (50 req/min, ok)
5. ✅ Valida payload (required: commit_sha, commit_message)
6. ✅ Logga request (response NO, config dice log_responses: false)
7. ✅ Passa a backend handler
8. ✅ Traccia metrics

**Response**:
```json
{
  "status": "ok",
  "log_id": 12345
}
```

### Esempio 3: Rate Limit Exceeded

**Request** (11° richiesta in 1 minuto):
```bash
curl -X POST http://157.90.29.66/api/abacus/invoke \
  -H "X-API-Key: zap_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","payload":{}}'
```

**API Guardian Flow**:
1. ✅ Trova endpoint config `abacus_invoke`
2. ✅ Verifica API key
3. ✅ Verifica permessi
4. ❌ **Rate limit exceeded** (max 10 req/min)
5. ❌ Ritorna 429

**Response**:
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 45
}
```

**Headers**:
```
HTTP/1.1 429 Too Many Requests
X-Rate-Limit-Limit: 10
X-Rate-Limit-Remaining: 0
X-Rate-Limit-Reset: 1700000045
Retry-After: 45
```

---

## 📝 TODO Implementation

### Priorità Alta

- [ ] Creare middleware `api-guardian.ts`
- [ ] Integrare in `server/_core/index.ts`
- [ ] Creare tabella `api_logs` nel database
- [ ] Testare auth con API key
- [ ] Testare rate limiting

### Priorità Media

- [ ] Implementare hot-reload config
- [ ] Dashboard monitoring (Grafana)
- [ ] Alert via email/Slack
- [ ] Rotazione log automatica

### Priorità Bassa

- [ ] Caching responses
- [ ] IP whitelist/blacklist
- [ ] Webhook retry logic
- [ ] OpenAPI spec generation

---

## 🔗 Link Utili

- **Config**: `/home/ubuntu/MIO-hub/system/api-guardian-config.json`
- **Logs**: `/home/ubuntu/MIO-hub/logs/api-guardian.log`
- **Backend**: http://157.90.29.66
- **Frontend**: https://dms-hub-app-new.vercel.app

---

**Documentazione compilata**: 18 novembre 2025  
**Contatto**: Abacus via MIO-hub
