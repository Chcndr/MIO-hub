# Backend REST su Hetzner - Design Architetturale

**Data**: 19 Novembre 2025  
**Versione**: 1.0  
**Autore**: Manus AI  
**Stato**: Design Phase

---

## 🎯 Obiettivo Generale

Creare un backend REST pulito e definitivo su Hetzner che:
- **Mantiene tRPC** come layer interno (dove già funziona)
- **Espone endpoint REST** consumabili da Dashboard, app clienti/operatori e integrazioni esterne
- **Integra API Guardian** per logging, permessi e risk management
- **Usa api/index.json** come single source of truth

---

## 🏗️ Architettura REST

### Stack Tecnologico

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Dashboard PA, App Cittadini, Hub Operatore, Integrazioni) │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                     │
│  - SSL/TLS Termination                                       │
│  - Rate Limiting                                             │
│  - CORS Headers                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              REST API Server (Express + TypeScript)          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           API Guardian Middleware                       │ │
│  │  - Auth Check (x-api-key / Bearer)                     │ │
│  │  - Permission Check (agents/permissions.json)          │ │
│  │  - Risk Assessment (config/api-guardian.json)          │ │
│  │  - Logging (logs/api-guardian.log)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                         │                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              REST Route Handlers                        │ │
│  │  /api/dmsHub/*  →  DMS Hub Adapter                     │ │
│  │  /api/mihub/*   →  MIHUB Adapter                       │ │
│  │  /api/logs/*    →  MIO Agent Adapter                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                         │                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          tRPC Adapter Layer (sottile)                   │ │
│  │  - Parse REST request (params/body/query)              │ │
│  │  - Call tRPC router                                     │ │
│  │  - Transform tRPC response → REST JSON                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                         │                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            tRPC Routers (Business Logic)                │ │
│  │  - dmsHubRouter (24 endpoint)                           │ │
│  │  - mioAgentRouter (3 endpoint)                          │ │
│  │  - mihubRouter (3 endpoint)                             │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               PostgreSQL Database (Neon)                     │
│  - 39 tabelle DMS Hub                                        │
│  - Drizzle ORM                                               │
└─────────────────────────────────────────────────────────────┘
```

### Struttura Directory

```
/home/ubuntu/mihub-backend/
├── src/
│   ├── index.ts                    # Entry point Express server
│   ├── middleware/
│   │   ├── apiGuardian.ts          # API Guardian middleware
│   │   ├── auth.ts                 # Authentication
│   │   ├── cors.ts                 # CORS configuration
│   │   └── rateLimit.ts            # Rate limiting
│   ├── routes/
│   │   ├── dmsHub.ts               # REST routes DMS Hub
│   │   ├── mihub.ts                # REST routes MIHUB
│   │   └── logs.ts                 # REST routes MIO Agent
│   ├── adapters/
│   │   ├── dmsHubAdapter.ts        # tRPC → REST adapter DMS Hub
│   │   ├── mihubAdapter.ts         # tRPC → REST adapter MIHUB
│   │   └── logsAdapter.ts          # tRPC → REST adapter Logs
│   ├── trpc/
│   │   ├── dmsHubRouter.ts         # tRPC router DMS Hub (esistente)
│   │   ├── mioAgentRouter.ts       # tRPC router MIO Agent (esistente)
│   │   └── mihubRouter.ts          # tRPC router MIHUB (esistente)
│   ├── services/
│   │   ├── guardian.ts             # API Guardian service
│   │   └── logger.ts               # Structured logging
│   └── types/
│       └── index.ts                # TypeScript types
├── config/
│   ├── api-guardian.json           # Guardian configuration
│   ├── agents-permissions.json     # Agent permissions
│   └── api-index.json              # Endpoint definitions
├── logs/
│   └── api-guardian.log            # Guardian logs
├── package.json
├── tsconfig.json
└── .env
```

---

## 🔌 Mapping Endpoint REST ↔ tRPC

### Convenzioni

- **Prefisso REST**: `/api/{service}/{resource}/{action}`
- **tRPC path**: `{service}.{resource}.{action}`
- **Metodi HTTP**: GET (query), POST (create), PUT (update), DELETE (delete)

### Tabella Mapping Completa

| REST Endpoint | Method | tRPC Path | Status | Priorità |
|---|---|---|---|---|
| **DMS Hub - Mercati** |
| `/api/dmsHub/markets/list` | GET | `dmsHub.markets.list` | ✅ Implemented | Alta |
| `/api/dmsHub/markets/getById` | GET | `dmsHub.markets.getById` | ✅ Implemented | Alta |
| `/api/dmsHub/markets/importFromSlotEditor` | POST | `dmsHub.markets.importFromSlotEditor` | ✅ Implemented | Bassa |
| `/api/dmsHub/markets/importAuto` | POST | `dmsHub.markets.importAuto` | ✅ Implemented | Bassa |
| **DMS Hub - Posteggi** |
| `/api/dmsHub/stalls/listByMarket` | GET | `dmsHub.stalls.listByMarket` | ✅ Implemented | Alta |
| `/api/dmsHub/stalls/getStatuses` | GET | `dmsHub.stalls.getStatuses` | ✅ Implemented | Alta |
| `/api/dmsHub/stalls/updateStatus` | POST | `dmsHub.stalls.updateStatus` | ✅ Implemented | Media |
| **DMS Hub - Operatori** |
| `/api/dmsHub/vendors/list` | GET | `dmsHub.vendors.list` | ✅ Implemented | Alta |
| `/api/dmsHub/vendors/getFullDetails` | GET | `dmsHub.vendors.getFullDetails` | ✅ Implemented | Alta |
| `/api/dmsHub/vendors/create` | POST | `dmsHub.vendors.create` | ✅ Implemented | Alta |
| `/api/dmsHub/vendors/update` | PUT | `dmsHub.vendors.update` | ✅ Implemented | Alta |
| **DMS Hub - Prenotazioni** |
| `/api/dmsHub/bookings/listActive` | GET | `dmsHub.bookings.listActive` | ✅ Implemented | Alta |
| `/api/dmsHub/bookings/create` | POST | `dmsHub.bookings.create` | ✅ Implemented | Alta |
| `/api/dmsHub/bookings/confirmCheckin` | POST | `dmsHub.bookings.confirmCheckin` | ✅ Implemented | Alta |
| `/api/dmsHub/bookings/cancel` | DELETE | `dmsHub.bookings.cancel` | ✅ Implemented | Media |
| **DMS Hub - Presenze** |
| `/api/dmsHub/presences/getTodayByMarket` | GET | `dmsHub.presences.getTodayByMarket` | ✅ Implemented | Alta |
| `/api/dmsHub/presences/checkout` | POST | `dmsHub.presences.checkout` | ✅ Implemented | Media |
| **DMS Hub - Controlli** |
| `/api/dmsHub/inspections/list` | GET | `dmsHub.inspections.list` | ✅ Implemented | Media |
| `/api/dmsHub/inspections/create` | POST | `dmsHub.inspections.create` | ✅ Implemented | Media |
| **DMS Hub - Verbali** |
| `/api/dmsHub/violations/list` | GET | `dmsHub.violations.list` | ✅ Implemented | Media |
| `/api/dmsHub/violations/create` | POST | `dmsHub.violations.create` | ✅ Implemented | Media |
| **MIO Agent** |
| `/api/logs/getLogs` | GET | `mioAgent.getLogs` | ✅ Implemented | Alta |
| `/api/logs/createLog` | POST | `mioAgent.createLog` | ✅ Implemented | Alta |
| `/api/logs/initSchema` | POST | `mioAgent.initSchema` | ✅ Implemented | Alta |
| **MIHUB** |
| `/api/mihub/tasks` | GET | `mihub.tasks.list` | 🔄 Planned | Alta |
| `/api/mihub/tasks` | POST | `mihub.tasks.create` | 🔄 Planned | Alta |
| `/api/mihub/deploy/vercel` | POST | `mihub.deploy.vercel` | 🔄 Planned | Alta |
| **GitHub API** |
| `/api/github/repos/{owner}/{repo}/contents/{path}` | GET | N/A (REST-only) | 🔄 Planned | Bassa |
| `/api/github/repos/{owner}/{repo}/contents/{path}` | PUT | N/A (REST-only) | 🔄 Planned | Bassa |

**Legenda**:
- ✅ **Implemented**: tRPC già funzionante, serve solo adapter REST
- 🔄 **Planned**: Da implementare (tRPC + REST)
- ❌ **Not Planned**: Non prioritario

---

## 🔐 Schema Auth & Sicurezza

### 1. Autenticazione

#### Header Supportati

```http
# Opzione 1: API Key (per agenti e integrazioni)
x-api-key: dms_live_abc123...

# Opzione 2: Bearer Token (per utenti dashboard)
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Validazione

```typescript
// middleware/auth.ts
export async function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const bearerToken = req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey) {
    // Validate API key against database
    const key = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.key, apiKey)
    });
    
    if (!key || key.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }
    
    req.auth = {
      type: 'api_key',
      keyId: key.id,
      name: key.name,
      scopes: key.scopes || []
    };
  } else if (bearerToken) {
    // Validate JWT token
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
    req.auth = {
      type: 'user',
      userId: decoded.userId,
      email: decoded.email
    };
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  next();
}
```

### 2. CORS Configuration

```typescript
// middleware/cors.ts
export const corsOptions = {
  origin: [
    'https://dms-hub-app-new.vercel.app',
    'https://dms-cittadini.vercel.app',
    'https://dms-operatore.vercel.app',
    'http://localhost:5173', // Dev
    'http://localhost:3000'  // Dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  exposedHeaders: ['x-request-id', 'x-response-time']
};
```

### 3. Rate Limiting

```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

// Default: 100 req/15min
export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

// Strict: 10 req/15min (per endpoint pericolosi)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded for sensitive endpoint'
});

// Endpoint pericolosi con strictLimiter:
// - POST /api/dmsHub/markets/importFromSlotEditor
// - POST /api/dmsHub/violations/create
// - POST /api/mihub/deploy/vercel
```

---

## 🛡️ API Guardian Integration

### 1. Guardian Middleware Flow

```typescript
// middleware/apiGuardian.ts
export async function guardianMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // 1. Load configurations
  const apiIndex = await loadJSON('config/api-index.json');
  const permissions = await loadJSON('config/agents-permissions.json');
  const guardianConfig = await loadJSON('config/api-guardian.json');
  
  // 2. Find endpoint definition
  const endpoint = findEndpoint(apiIndex, req.method, req.path);
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  
  // 3. Check agent permissions
  const agent = req.auth?.name || 'unknown';
  const permission = checkPermission(permissions, agent, endpoint.id);
  
  if (!permission.allowed) {
    logGuardian({
      timestamp: new Date().toISOString(),
      agent,
      method: req.method,
      path: req.path,
      status: 'denied',
      reason: permission.reason,
      risk_level: endpoint.risk_level
    });
    
    return res.status(403).json({ 
      error: 'Permission denied',
      reason: permission.reason
    });
  }
  
  // 4. Check risk level & confirmation
  if (endpoint.risk_level === 'high' && !req.headers['x-confirm-action']) {
    return res.status(428).json({
      error: 'Confirmation required',
      message: 'This is a high-risk operation. Include x-confirm-action: true header to proceed.'
    });
  }
  
  // 5. Log allowed request
  logGuardian({
    timestamp: new Date().toISOString(),
    agent,
    method: req.method,
    path: req.path,
    status: 'allowed',
    risk_level: endpoint.risk_level,
    require_confirmation: endpoint.risk_level === 'high'
  });
  
  // 6. Attach metadata to request
  req.guardian = {
    endpoint,
    agent,
    startTime
  };
  
  next();
}
```

### 2. Guardian Log Format

```json
{
  "timestamp": "2025-11-19T10:30:45.123Z",
  "agent": "mio",
  "method": "GET",
  "path": "/api/dmsHub/markets/list",
  "status": "allowed",
  "risk_level": "low",
  "response_time_ms": 145,
  "status_code": 200
}
```

```json
{
  "timestamp": "2025-11-19T10:31:12.456Z",
  "agent": "zapier",
  "method": "POST",
  "path": "/api/dmsHub/violations/create",
  "status": "denied",
  "reason": "No permission rule found for agent 'zapier' on endpoint 'violations.create'",
  "risk_level": "high"
}
```

### 3. Configuration Files

#### `config/agents-permissions.json`

```json
{
  "agents": {
    "mio": {
      "display_name": "MIO Agent",
      "permissions": ["*"],
      "description": "Full access to all endpoints"
    },
    "manus": {
      "display_name": "Manus AI",
      "permissions": [
        "markets.*",
        "stalls.*",
        "vendors.*",
        "bookings.*",
        "logs.*"
      ],
      "description": "Read/write access to core DMS Hub"
    },
    "abacus": {
      "display_name": "Abacus Analytics",
      "permissions": [
        "markets.list",
        "stalls.listByMarket",
        "vendors.list",
        "bookings.listActive"
      ],
      "description": "Read-only access for analytics"
    },
    "zapier": {
      "display_name": "Zapier Integration",
      "permissions": [
        "logs.createLog",
        "bookings.create",
        "vendors.create"
      ],
      "description": "Limited write access for automation"
    }
  }
}
```

#### `config/api-guardian.json`

```json
{
  "risk_levels": {
    "low": {
      "require_confirmation": false,
      "rate_limit": 100,
      "log_level": "info"
    },
    "medium": {
      "require_confirmation": false,
      "rate_limit": 50,
      "log_level": "warn"
    },
    "high": {
      "require_confirmation": true,
      "rate_limit": 10,
      "log_level": "error"
    }
  },
  "sensitive_endpoints": [
    "markets.importFromSlotEditor",
    "violations.create",
    "mihub.deploy.vercel"
  ]
}
```

---

## 📝 Adapter Pattern Example

### DMS Hub Adapter

```typescript
// adapters/dmsHubAdapter.ts
import { dmsHubRouter } from '../trpc/dmsHubRouter';

export class DmsHubAdapter {
  // GET /api/dmsHub/markets/list
  async getMarketsList(req, res) {
    try {
      const data = await dmsHubRouter.markets.list.query();
      
      res.json({
        success: true,
        data,
        meta: {
          endpoint: 'markets.list',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // GET /api/dmsHub/markets/getById?id=1
  async getMarketById(req, res) {
    try {
      const { id } = req.query;
      const data = await dmsHubRouter.markets.getById.query({ id: Number(id) });
      
      res.json({
        success: true,
        data,
        meta: {
          endpoint: 'markets.getById',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // POST /api/dmsHub/vendors/create
  async createVendor(req, res) {
    try {
      const data = await dmsHubRouter.vendors.create.mutate(req.body);
      
      res.status(201).json({
        success: true,
        data,
        meta: {
          endpoint: 'vendors.create',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
```

### Route Registration

```typescript
// routes/dmsHub.ts
import express from 'express';
import { DmsHubAdapter } from '../adapters/dmsHubAdapter';
import { authMiddleware } from '../middleware/auth';
import { guardianMiddleware } from '../middleware/apiGuardian';

const router = express.Router();
const adapter = new DmsHubAdapter();

// Apply middleware globally
router.use(authMiddleware);
router.use(guardianMiddleware);

// Mercati
router.get('/markets/list', adapter.getMarketsList);
router.get('/markets/getById', adapter.getMarketById);

// Posteggi
router.get('/stalls/listByMarket', adapter.getStallsByMarket);
router.get('/stalls/getStatuses', adapter.getStallStatuses);

// Operatori
router.get('/vendors/list', adapter.getVendorsList);
router.get('/vendors/getFullDetails', adapter.getVendorDetails);
router.post('/vendors/create', adapter.createVendor);
router.put('/vendors/update', adapter.updateVendor);

// Prenotazioni
router.get('/bookings/listActive', adapter.getActiveBookings);
router.post('/bookings/create', adapter.createBooking);
router.post('/bookings/confirmCheckin', adapter.confirmCheckin);
router.delete('/bookings/cancel', adapter.cancelBooking);

// Presenze
router.get('/presences/getTodayByMarket', adapter.getTodayPresences);
router.post('/presences/checkout', adapter.checkout);

export default router;
```

---

## 🚀 Endpoint Prioritari - Roadmap

### Blocco 1: MIHUB + MIO Agent (Priorità Massima)

**Obiettivo**: Abilitare logging e orchestrazione multi-agente

| Endpoint | Method | Status | Note |
|---|---|---|---|
| `/api/logs/getLogs` | GET | ✅ Ready | tRPC esistente |
| `/api/logs/createLog` | POST | ✅ Ready | tRPC esistente |
| `/api/logs/initSchema` | POST | ✅ Ready | tRPC esistente |
| `/api/mihub/tasks` | GET | 🔄 Planned | Da implementare |
| `/api/mihub/tasks` | POST | 🔄 Planned | Da implementare |
| `/api/mihub/deploy/vercel` | POST | 🔄 Planned | Da implementare |

**Timeline**: 1-2 giorni

### Blocco 2: DMS Hub Core (Alta Priorità)

**Obiettivo**: Abilitare Dashboard PA e integrazioni principali

| Endpoint | Method | Status | Note |
|---|---|---|---|
| `/api/dmsHub/markets/list` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/markets/getById` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/stalls/listByMarket` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/stalls/getStatuses` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/vendors/list` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/vendors/create` | POST | ✅ Ready | tRPC esistente |
| `/api/dmsHub/vendors/update` | PUT | ✅ Ready | tRPC esistente |
| `/api/dmsHub/vendors/getFullDetails` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/bookings/listActive` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/bookings/create` | POST | ✅ Ready | tRPC esistente |
| `/api/dmsHub/bookings/confirmCheckin` | POST | ✅ Ready | tRPC esistente |
| `/api/dmsHub/presences/getTodayByMarket` | GET | ✅ Ready | tRPC esistente |

**Timeline**: 2-3 giorni

### Blocco 3: DMS Hub Completo (Media Priorità)

**Obiettivo**: Completare tutti gli endpoint DMS Hub

| Endpoint | Method | Status | Note |
|---|---|---|---|
| `/api/dmsHub/bookings/cancel` | DELETE | ✅ Ready | tRPC esistente |
| `/api/dmsHub/presences/checkout` | POST | ✅ Ready | tRPC esistente |
| `/api/dmsHub/inspections/list` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/inspections/create` | POST | ✅ Ready | tRPC esistente |
| `/api/dmsHub/violations/list` | GET | ✅ Ready | tRPC esistente |
| `/api/dmsHub/violations/create` | POST | ✅ Ready | tRPC esistente |
| `/api/dmsHub/markets/importFromSlotEditor` | POST | ✅ Ready | tRPC esistente |
| `/api/dmsHub/markets/importAuto` | POST | ✅ Ready | tRPC esistente |
| `/api/dmsHub/stalls/updateStatus` | POST | ✅ Ready | tRPC esistente |

**Timeline**: 1-2 giorni

---

## 📊 Stato Implementazione

### Riepilogo

- **Endpoint totali definiti**: 30
- **Endpoint con tRPC esistente**: 27 (90%)
- **Endpoint da implementare**: 3 (10%)
  - `mihub.tasks.list`
  - `mihub.tasks.create`
  - `mihub.deploy.vercel`

### Strategia

1. **Fase 1** (1-2 giorni): 
   - Setup server Express + middleware
   - Implementare Blocco 1 (MIHUB + MIO Agent)
   - Configurare API Guardian
   - Deploy su Hetzner

2. **Fase 2** (2-3 giorni):
   - Implementare Blocco 2 (DMS Hub Core)
   - Test Playground Dashboard
   - Verifica log Guardian

3. **Fase 3** (1-2 giorni):
   - Implementare Blocco 3 (DMS Hub Completo)
   - Test integrazione completa
   - Documentazione API

**Totale stimato**: 4-7 giorni

---

## 🔧 Configurazione Nginx

```nginx
# /etc/nginx/sites-available/mihub-api

upstream mihub_backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name mihub.157-90-29-66.nip.io;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mihub.157-90-29-66.nip.io;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/mihub.157-90-29-66.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mihub.157-90-29-66.nip.io/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # CORS Headers
    add_header Access-Control-Allow-Origin "https://dms-hub-app-new.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, x-api-key" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
    
    # Proxy to Node.js backend
    location /api/ {
        proxy_pass http://mihub_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://mihub_backend;
        access_log off;
    }
}
```

---

## 📦 Package.json

```json
{
  "name": "mihub-backend",
  "version": "1.0.0",
  "description": "Backend REST per DMS Hub + MIHUB con API Guardian",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "@trpc/server": "^10.45.0",
    "drizzle-orm": "^0.29.1",
    "postgres": "^3.4.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "jest": "^29.7.0"
  }
}
```

---

## ✅ Checklist Implementazione

### Setup Iniziale
- [ ] Creare repository `mihub-backend` su GitHub
- [ ] Setup progetto Node.js + TypeScript
- [ ] Configurare ESLint + Prettier
- [ ] Setup Drizzle ORM con database Neon
- [ ] Configurare variabili ambiente (.env)

### Middleware
- [ ] Implementare `authMiddleware` (x-api-key + Bearer)
- [ ] Implementare `corsMiddleware` (whitelist origins)
- [ ] Implementare `rateLimitMiddleware` (default + strict)
- [ ] Implementare `guardianMiddleware` (permission + risk + log)
- [ ] Implementare `errorHandlerMiddleware`

### Adapters
- [ ] Implementare `DmsHubAdapter` (24 endpoint)
- [ ] Implementare `MioAgentAdapter` (3 endpoint)
- [ ] Implementare `MihubAdapter` (3 endpoint)

### Routes
- [ ] Configurare route `/api/dmsHub/*`
- [ ] Configurare route `/api/logs/*`
- [ ] Configurare route `/api/mihub/*`
- [ ] Configurare route `/health`

### API Guardian
- [ ] Creare `services/guardian.ts`
- [ ] Implementare `checkPermission()`
- [ ] Implementare `logGuardian()`
- [ ] Implementare `loadConfig()`
- [ ] Setup file `logs/api-guardian.log`

### Deploy Hetzner
- [ ] Setup server Ubuntu 22.04
- [ ] Installare Node.js 22.13.0
- [ ] Installare Nginx
- [ ] Configurare SSL (Let's Encrypt)
- [ ] Configurare Nginx reverse proxy
- [ ] Setup PM2 per process management
- [ ] Configurare firewall (ufw)

### Testing
- [ ] Test endpoint Blocco 1 (MIHUB + MIO Agent)
- [ ] Test endpoint Blocco 2 (DMS Hub Core)
- [ ] Test endpoint Blocco 3 (DMS Hub Completo)
- [ ] Test API Guardian (permission denied)
- [ ] Test rate limiting
- [ ] Test CORS
- [ ] Test Playground Dashboard

### Documentazione
- [ ] Aggiornare `api/index.json` con campo `implemented`
- [ ] Creare `README.md` backend
- [ ] Documentare variabili ambiente
- [ ] Documentare processo deploy

---

## 🎯 Next Steps

1. **Review Design**: Approvazione architettura e mapping endpoint
2. **Setup Repository**: Creare `mihub-backend` su GitHub
3. **Implement Blocco 1**: MIHUB + MIO Agent (priorità massima)
4. **Deploy Hetzner**: Configurare server e Nginx
5. **Test & Iterate**: Verificare con Playground Dashboard

---

**Fine Documento Design**
