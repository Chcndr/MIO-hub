# Endpoint Implementation Status - MIHUB Backend

**Data aggiornamento:** 28 novembre 2025  
**Backend commit:** fe1eab7 (DMS Hub endpoints)

---

## 📋 Legenda Status

| Status | Significato | Descrizione |
|--------|-------------|-------------|
| ✅ **IMPLEMENTED** | Implementato e testato | Endpoint funzionante, pronto per produzione |
| ⚠️ **PARTIAL** | Parzialmente implementato | Funziona ma mancano feature o validazioni |
| 🚧 **IN_PROGRESS** | In sviluppo | Implementazione in corso |
| ❌ **NOT_IMPLEMENTED** | Non implementato | Solo definito in api/index.json, nessun codice |
| 🔒 **PROTECTED** | Protetto Guardian | Richiede autenticazione agente |

---

## 🎯 Orchestratore & Agenti

### POST `/api/mihub/orchestrator`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** 🔒 Guardian (tutti gli agenti)

**Descrizione:** Endpoint principale orchestratore MIO per routing richieste agli agenti.

**Modalità supportate:**
- ✅ `mode: "auto"` - Determina agente automaticamente da messaggio
- ✅ `mode: "manual"` - Usa `targetAgent` specificato
- ✅ `mode: "chat"` - Chat diretta con agente LLM

**Agenti supportati:**
- ✅ `mio` - Orchestratore centrale (Gemini 2.5 Flash)
- ✅ `dev` - Sviluppatore (Gemini 2.5 Flash)
- ✅ `gemini_arch` - Architetto (Gemini 2.5 Flash)
- ✅ `abacus` - Analisi dati LLM (Gemini 2.5 Flash)
- ✅ `abacus_sql` - Query SQL dirette (NO LLM)

**determineAgent keywords:**
- ✅ `abacus_sql`: quanti, quante, conta, numero, lista, tabelle, concessioni, posteggi, vendor, mercati, sql
- ✅ `abacus`: analizza, statistiche, metriche, report, log, insights, readme, file, repository
- ✅ `dev`: codice, bug, deploy, github, implementa, modifica
- ✅ `gemini_arch`: architettura, blueprint, design, review
- ✅ `mio`: default (orchestratore)

**Task abacus_sql supportati:**
- ✅ `count_table` - Conta record in tabella con filtro
- ✅ `count_active_stalls` - Conta posteggi attivi per mercato
- ✅ `query_table` - Query SQL custom
- ✅ `list_tables` - Lista tabelle database

**internalTraces:**
- ✅ Popolato per `abacus_sql` con query reali
- ❌ Non popolato per `mio`, `dev`, `gemini_arch`, `abacus` LLM

**Test:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/mihub/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "auto",
    "message": "Quante concessioni attive ci sono?"
  }'
```

**Response attesa:**
```json
{
  "success": true,
  "agent": "abacus_sql",
  "conversationId": "conv_abc123",
  "message": "Ho trovato 42 concessioni attive nel database.",
  "internalTraces": [
    {
      "from": "mio",
      "to": "abacus",
      "role": "user",
      "message": "Conta record in tabella concessions con filtro: is_active = true",
      "timestamp": "2025-11-28T04:00:00.000Z",
      "meta": { "task": "count_table", "params": {...} }
    },
    {
      "from": "abacus",
      "to": "mio",
      "role": "assistant",
      "message": "Query eseguita: SELECT COUNT(*) FROM concessions WHERE is_active = true\nRisultato: 42 record trovati",
      "timestamp": "2025-11-28T04:00:01.500Z",
      "meta": { "sqlEndpoint": "/api/abacus/sql/count", "sqlQuery": "...", "sqlResult": 42 }
    }
  ],
  "error": null
}
```

---

## 📊 Abacus SQL (Query Database Neon)

### POST `/api/abacus/sql/count`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** 🔒 Guardian (abacus, abacus_sql)

**Descrizione:** Conta record in tabella con filtro WHERE.

**Request:**
```json
{
  "table": "concessions",
  "where": "is_active = true",
  "params": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 42
  }
}
```

**Test:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/abacus/sql/count \
  -H "Content-Type: application/json" \
  -H "x-agent-id: abacus" \
  -d '{"table":"concessions","where":"is_active = true","params":[]}'
```

---

### POST `/api/abacus/sql/query`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** 🔒 Guardian (abacus, abacus_sql)

**Descrizione:** Esegue query SQL custom (SELECT only).

**Request:**
```json
{
  "query": "SELECT * FROM concessions WHERE is_active = true LIMIT 10",
  "params": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rows": [
      { "id": 1, "vendor_id": 5, "is_active": true, ... },
      ...
    ],
    "rowCount": 10
  }
}
```

**Test:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/abacus/sql/query \
  -H "Content-Type: application/json" \
  -H "x-agent-id: abacus" \
  -d '{"query":"SELECT * FROM concessions WHERE is_active = true LIMIT 10","params":[]}'
```

---

### POST `/api/abacus/sql/tables`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** 🔒 Guardian (abacus, abacus_sql)

**Descrizione:** Lista tutte le tabelle nel database Neon.

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tables": [
      "markets",
      "stalls",
      "vendors",
      "concessions",
      "audit_logs",
      "system_logs",
      "webhook_logs",
      "mio_agent_logs"
    ]
  }
}
```

**Test:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/abacus/sql/tables \
  -H "Content-Type: application/json" \
  -H "x-agent-id: abacus"
```

---

## 📁 Abacus GitHub (Lettura Repository)

### POST `/api/abacus/github/list`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** 🔒 Guardian (abacus)

**Descrizione:** Lista file/directory in repository GitHub.

**Request:**
```json
{
  "owner": "Chcndr",
  "repo": "MIO-hub",
  "path": "docs/mio"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      { "name": "INTERNAL_TRACES_FORMAT.md", "type": "file", "size": 12345 },
      { "name": "README.md", "type": "file", "size": 5678 }
    ]
  }
}
```

**Test:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/abacus/github/list \
  -H "Content-Type: application/json" \
  -H "x-agent-id: abacus" \
  -d '{"owner":"Chcndr","repo":"MIO-hub","path":"docs/mio"}'
```

---

### POST `/api/abacus/github/get`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** 🔒 Guardian (abacus)

**Descrizione:** Legge contenuto file da repository GitHub.

**Request:**
```json
{
  "owner": "Chcndr",
  "repo": "MIO-hub",
  "path": "docs/mio/INTERNAL_TRACES_FORMAT.md"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "# Internal Traces Format...",
    "encoding": "utf-8",
    "size": 12345
  }
}
```

**Test:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/abacus/github/get \
  -H "Content-Type: application/json" \
  -H "x-agent-id: abacus" \
  -d '{"owner":"Chcndr","repo":"MIO-hub","path":"docs/mio/INTERNAL_TRACES_FORMAT.md"}'
```

---

## 🏪 Markets & Stalls (DMS Hub)

### GET `/api/markets`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Lista tutti i mercati.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "GR001", "name": "Mercato Grosseto", "address": "...", ... },
    ...
  ]
}
```

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/markets
```

---

### GET `/api/markets/:id`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Dettagli singolo mercato.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "GR001",
    "name": "Mercato Grosseto",
    "address": "Via Roma 1, Grosseto",
    "city": "Grosseto",
    "province": "GR",
    "region": "Toscana",
    "latitude": 42.7635,
    "longitude": 11.1136,
    "active": true
  }
}
```

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/markets/1
```

---

### GET `/api/markets/:id/stalls`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Lista posteggi per mercato.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "market_id": 1, "code": "A01", "sector": "A", "is_active": true, ... },
    ...
  ]
}
```

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/markets/1/stalls
```

---

### GET `/api/stalls/:id`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Dettagli singolo posteggio.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "market_id": 1,
    "code": "A01",
    "sector": "A",
    "is_active": true,
    "dimensions": "3x2",
    "price_monthly": 150.00
  }
}
```

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/stalls/1
```

---

## 👤 Vendors & Concessions

### GET `/api/vendors`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Lista tutti i vendor.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Mario Rossi", "vat_number": "IT12345678901", "email": "mario@example.com", ... },
    ...
  ]
}
```

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/vendors
```

---

### GET `/api/concessions`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Lista tutte le concessioni.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "vendor_id": 5, "stall_id": 10, "start_date": "2025-01-01", "end_date": "2025-12-31", "is_active": true, ... },
    ...
  ]
}
```

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/concessions
```

---

## 🔐 Admin & Deploy

### POST `/api/admin/deploy-backend`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** 🔒 Guardian (solo manus e mio)

**Descrizione:** Trigger deploy backend MIHUB su Hetzner.

**Request:**
```json
{
  "reason": "Update CORS whitelist to include mio-hub.me",
  "branch": "master"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deploy completed successfully",
  "agent": "manus",
  "reason": "Update CORS whitelist to include mio-hub.me",
  "branch": "master",
  "timestamp": "2025-11-28T04:00:00.000Z",
  "output": {
    "stdout": "=== Deploy Complete ===\n...",
    "stderr": null
  }
}
```

**Test:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/admin/deploy-backend \
  -H "Content-Type: application/json" \
  -H "x-agent-id: manus" \
  -d '{"reason":"Test deploy","branch":"master"}'
```

---

### GET `/api/admin/deploy-backend/status`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Verifica se script deploy esiste.

**Response:**
```json
{
  "service": "MIHUB Deploy Backend",
  "status": "active",
  "scriptExists": true,
  "timestamp": "2025-11-28T04:00:00.000Z"
}
```

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/admin/deploy-backend/status
```

---

## 📝 Logs & Guardian

### POST `/api/logs/createLog`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** 🔒 Guardian (tutti gli agenti)

**Descrizione:** Crea log Guardian per monitoraggio attività agenti.

**Request:**
```json
{
  "agent": "mio",
  "serviceId": "mihub.orchestrator",
  "endpoint": "/api/mihub/orchestrator",
  "method": "POST",
  "statusCode": 200,
  "risk": "low",
  "success": true,
  "message": "Orchestrator request processed successfully",
  "meta": {
    "conversationId": "conv_abc123",
    "agent": "abacus_sql",
    "task": "count_table"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "timestamp": "2025-11-28T04:00:00.000Z"
  }
}
```

**Test:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/logs/createLog \
  -H "Content-Type: application/json" \
  -H "x-agent-id: mio" \
  -d '{"agent":"mio","serviceId":"mihub.test","endpoint":"/test","method":"GET","statusCode":200,"risk":"low","success":true,"message":"Test log"}'
```

---

### GET `/api/guardian/logs`

**Status:** ❌ **NOT_IMPLEMENTED**  
**Workaround:** Usa `/api/abacus/sql/query` con query su `mio_agent_logs`

**Descrizione:** Lista log Guardian filtrati per agente/data.

**Workaround query:**
```sql
SELECT * FROM mio_agent_logs 
WHERE agent IN ('mio', 'manus', 'abacus', 'zapier') 
ORDER BY timestamp DESC 
LIMIT 50
```

**Test workaround:**
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/abacus/sql/query \
  -H "Content-Type: application/json" \
  -H "x-agent-id: abacus" \
  -d '{"query":"SELECT * FROM mio_agent_logs WHERE agent IN ('\''mio'\'','\''manus'\'','\''abacus'\'','\''zapier'\'') ORDER BY timestamp DESC LIMIT 50","params":[]}'
```

---

## 🚧 Endpoint Non Implementati

### POST `/api/mihub/tasks`

**Status:** ❌ **NOT_IMPLEMENTED**

**Descrizione:** Gestione task multi-agente (creazione, assegnazione, tracking).

**Definito in:** `api/index.json`

**TODO:** Implementare sistema task con:
- Creazione task da orchestratore
- Assegnazione agenti
- Tracking stato (pending, in_progress, completed, failed)
- Dipendenze tra task

---

### POST `/api/mihub/deploy/vercel`

**Status:** ❌ **NOT_IMPLEMENTED**

**Descrizione:** Trigger deploy frontend Vercel.

**Definito in:** `api/index.json`

**TODO:** Implementare webhook Vercel o GitHub Action

---

### POST `/api/zapier/trigger`

**Status:** ❌ **NOT_IMPLEMENTED**

**Descrizione:** Trigger workflow Zapier.

**Definito in:** `api/index.json`

**TODO:** Integrare Zapier webhook

---

## 📊 Riepilogo Status

| Categoria | Implementati | Parziali | Non Implementati |
|-----------|--------------|----------|------------------|
| Orchestratore | 1 | 0 | 0 |
| Abacus SQL | 3 | 0 | 0 |
| Abacus GitHub | 2 | 0 | 0 |
| Markets/Stalls | 4 | 0 | 0 |
| Vendors/Concessions | 2 | 0 | 0 |
| Admin/Deploy | 2 | 0 | 0 |
| Logs/Guardian | 1 | 0 | 1 |
| Tasks | 0 | 0 | 1 |
| Zapier | 0 | 0 | 1 |
| **TOTALE** | **15** | **0** | **3** |

**Percentuale implementazione:** 83% (15/18)

---

## 🎯 Priorità Implementazione

### Alta Priorità

1. ✅ **Orchestratore MIO → Abacus SQL** (FATTO - commit 32bdc49)
2. ⏭️ **GET `/api/guardian/logs`** - Per Dashboard PA Guardian logs panel
3. ⏭️ **POST `/api/mihub/tasks`** - Per orchestrazione multi-agente avanzata

### Media Priorità

4. ⏭️ **POST `/api/mihub/deploy/vercel`** - Per deploy frontend automatico
5. ⏭️ **POST `/api/zapier/trigger`** - Per integrazioni esterne

### Bassa Priorità

6. ⏭️ Endpoint analytics/metriche
7. ⏭️ Endpoint notifiche

---

**Fine Documentazione**


---

## 🏪 DMS Hub (Gestione Mercati e Commercio)

### GET `/api/dmsHub/markets/list`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Lista mercati con statistiche posteggi (occupati, liberi).

**Query Parameters:** Nessuno

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "GR001",
      "name": "Mercato Grosseto",
      "city": "Grosseto",
      "days": "Martedì, Giovedì",
      "totalStalls": 160,
      "occupiedStalls": 145,
      "freeStalls": 15,
      "active": true,
      "latitude": "42.75855600",
      "longitude": "11.11423200",
      "createdAt": "2025-11-21T23:52:05.623Z",
      "updatedAt": "2025-11-21T23:52:05.623Z"
    }
  ],
  "count": 1
}
```

**Dati:** ✅ Reali da Neon PostgreSQL (tabelle `markets` + `stalls`)

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/dmsHub/markets/list
```

---

### GET `/api/dmsHub/markets/getById`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Dettagli mercato completo con posteggi e statistiche.

**Query Parameters:**
- `marketId` (required) - ID numerico del mercato

**Response:**
```json
{
  "success": true,
  "data": {
    "market": {
      "id": 1,
      "code": "GR001",
      "name": "Mercato Grosseto",
      "municipality": "Grosseto",
      "days": "Martedì, Giovedì",
      "totalStalls": 160,
      "status": "active",
      "latitude": "42.75855600",
      "longitude": "11.11423200"
    },
    "stalls": [
      {
        "id": 1,
        "number": "1",
        "gisSlotId": "stall-1",
        "width": "4.00",
        "depth": "7.60",
        "type": "fisso",
        "status": "occupato",
        "orientation": "120.30",
        "notes": null,
        "vendorId": null,
        "vendorBusinessName": null,
        "vendorContactName": null
      }
    ],
    "statistics": {
      "totalStalls": 160,
      "occupied": 145,
      "free": 15,
      "reserved": 0,
      "booked": 0
    }
  }
}
```

**Dati:** ✅ Reali da Neon PostgreSQL (tabelle `markets`, `stalls`)

**Test:**
```bash
curl "https://mihub.157-90-29-66.nip.io/api/dmsHub/markets/getById?marketId=1"
```

---

### GET `/api/dmsHub/stalls/listByMarket`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Lista posteggi per mercato con vendor info.

**Query Parameters:**
- `marketId` (required) - ID numerico del mercato

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "marketId": 1,
      "number": "1",
      "gisSlotId": "stall-1",
      "width": "4.00",
      "depth": "7.60",
      "type": "fisso",
      "status": "occupato",
      "orientation": "120.30",
      "notes": null,
      "vendorId": null,
      "vendorBusinessName": null,
      "vendorContactName": null,
      "createdAt": "2025-11-21T23:52:05.630Z",
      "updatedAt": "2025-11-26T22:38:28.667Z"
    }
  ],
  "count": 160
}
```

**Dati:** ✅ Reali da Neon PostgreSQL (tabelle `stalls` LEFT JOIN `vendors`)

**Test:**
```bash
curl "https://mihub.157-90-29-66.nip.io/api/dmsHub/stalls/listByMarket?marketId=1"
```

---

### GET `/api/dmsHub/vendors/list`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Lista operatori/imprese con concessioni attive.

**Query Parameters:** Nessuno

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "Mario",
      "lastName": "Rossi",
      "businessName": "Rossi Frutta & Verdura",
      "businessType": "ambulante",
      "fiscalCode": "RSSMRA70A01H501Z",
      "vatNumber": "IT12345678901",
      "email": "mario.rossi@example.com",
      "phone": "+39 333 1234567",
      "address": "Via Roma 123",
      "city": "Grosseto",
      "province": "GR",
      "zipCode": "58100",
      "status": "active",
      "activeConcessions": 2,
      "createdAt": "2025-11-21T23:52:05.640Z",
      "updatedAt": "2025-11-21T23:52:05.640Z"
    }
  ],
  "count": 1
}
```

**Dati:** ✅ Reali da Neon PostgreSQL (tabelle `vendors` LEFT JOIN `concessions`)

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/dmsHub/vendors/list
```

---

### GET `/api/dmsHub/concessions/list`

**Status:** ✅ **IMPLEMENTED**  
**Protection:** Nessuna (pubblico)

**Descrizione:** Lista concessioni con filtri opzionali.

**Query Parameters:**
- `vendorId` (optional) - Filtra per operatore
- `status` (optional) - Filtra per status (active, expired, suspended)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "vendorId": 1,
      "vendorBusinessName": "Rossi Frutta & Verdura",
      "marketId": 1,
      "marketName": "Mercato Grosseto",
      "stallId": 5,
      "stallNumber": "5",
      "type": "fisso",
      "validFrom": "2025-01-01",
      "validTo": "2025-12-31",
      "status": "active",
      "notes": null,
      "createdAt": "2025-11-21T23:52:05.650Z",
      "updatedAt": "2025-11-21T23:52:05.650Z"
    }
  ],
  "count": 1
}
```

**Dati:** ✅ Reali da Neon PostgreSQL (tabelle `concessions` LEFT JOIN `vendors`, `markets`, `stalls`)

**Test:**
```bash
curl "https://mihub.157-90-29-66.nip.io/api/dmsHub/concessions/list?vendorId=1&status=active"
```

---

## 📊 Riepilogo Status DMS Hub

| Endpoint | Method | Status | Dati | Protection |
|----------|--------|--------|------|------------|
| `/api/dmsHub/markets/list` | GET | ✅ IMPLEMENTED | Reali (Neon) | Pubblico |
| `/api/dmsHub/markets/getById` | GET | ✅ IMPLEMENTED | Reali (Neon) | Pubblico |
| `/api/dmsHub/stalls/listByMarket` | GET | ✅ IMPLEMENTED | Reali (Neon) | Pubblico |
| `/api/dmsHub/vendors/list` | GET | ✅ IMPLEMENTED | Reali (Neon) | Pubblico |
| `/api/dmsHub/concessions/list` | GET | ✅ IMPLEMENTED | Reali (Neon) | Pubblico |

**Totale DMS Hub:** 5/5 endpoint implementati ✅  
**Mock:** 0/5 ❌  
**Non implementati:** 0/5 ❌

**Note:**
- ✅ Tutti gli endpoint DMS Hub sono compatibili con documentazione `DMS_HUB_DOCUMENTAZIONE_COMPLETA.pdf`
- ✅ Nessun mock, solo dati reali da Neon PostgreSQL
- ✅ JSON grezzo senza wrapper finti
- ✅ Error handling completo (400, 404, 500)
- ⚠️ **Deploy backend Hetzner richiesto** (commit fe1eab7)

---
