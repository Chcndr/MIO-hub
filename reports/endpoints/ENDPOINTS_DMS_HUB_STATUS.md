# Audit Endpoint DMS Hub - Status Reale

**Data:** 28 novembre 2025  
**Backend testato:** https://mihub.157-90-29-66.nip.io  
**Metodo:** Test reali con curl (nessuna simulazione)

---

## 📊 Riepilogo Generale

| Categoria | Totale | ✅ Funzionanti | ❌ Rotti | ⚠️ Parziali |
|-----------|--------|----------------|----------|-------------|
| **DMS Hub** | 5 | 0 | 5 | 0 |
| **Markets** | 10 | 3 | 0 | 7 |
| **Stalls** | 4 | 0 | 0 | 4 |
| **Vendors** | 5 | 1 | 0 | 4 |
| **GIS** | 2 | 2 | 0 | 0 |
| **TOTALE** | **26** | **6** | **5** | **15** |

**Percentuale funzionanti:** 23% (6/26)  
**Percentuale non implementati:** 19% (5/26)  
**Percentuale parziali/non testati:** 58% (15/26)

---

## 🔴 ENDPOINT /api/dmsHub/* (0/5 funzionanti)

### ❌ GET /api/dmsHub/markets/list

**Status:** ❌ **ROTTO** (404 NOT FOUND)  
**Usato da:** Dashboard PA → Gestione Mercati  
**Errore:** `{"error":"Endpoint not found","path":"/api/dmsHub/markets/list","method":"GET","message":"This endpoint is not available. Check api/index.json for available endpoints."}`

**Causa:** Backend Hetzner non ha commit fe1eab7 (endpoint implementato ma non deployato)

**Soluzione:** Deploy backend con commit fe1eab7

---

### ❌ GET /api/dmsHub/markets/getById

**Status:** ❌ **ROTTO** (404 NOT FOUND)  
**Usato da:** Dashboard PA → Gestione Mercati (dettagli mercato)  
**Errore:** `{"error":"Endpoint not found","path":"/api/dmsHub/markets/getById","method":"GET","message":"This endpoint is not available. Check api/index.json for available endpoints."}`

**Causa:** Backend Hetzner non ha commit fe1eab7

**Soluzione:** Deploy backend con commit fe1eab7

---

### ❌ GET /api/dmsHub/stalls/listByMarket

**Status:** ❌ **ROTTO** (404 NOT FOUND)  
**Usato da:** Dashboard PA → Gestione Posteggi  
**Errore:** `{"error":"Endpoint not found","path":"/api/dmsHub/stalls/listByMarket","method":"GET","message":"This endpoint is not available. Check api/index.json for available endpoints."}`

**Causa:** Backend Hetzner non ha commit fe1eab7

**Soluzione:** Deploy backend con commit fe1eab7

---

### ❌ GET /api/dmsHub/vendors/list

**Status:** ❌ **ROTTO** (404 NOT FOUND)  
**Usato da:** Dashboard PA → Gestione Imprese  
**Errore:** `{"error":"Endpoint not found","path":"/api/dmsHub/vendors/list","method":"GET","message":"This endpoint is not available. Check api/index.json for available endpoints."}`

**Causa:** Backend Hetzner non ha commit fe1eab7

**Soluzione:** Deploy backend con commit fe1eab7

---

### ❌ GET /api/dmsHub/concessions/list

**Status:** ❌ **ROTTO** (404 NOT FOUND)  
**Usato da:** Dashboard PA → Gestione Concessioni  
**Errore:** `{"error":"Endpoint not found","path":"/api/dmsHub/concessions/list","method":"GET","message":"This endpoint is not available. Check api/index.json for available endpoints."}`

**Causa:** Backend Hetzner non ha commit fe1eab7

**Soluzione:** Deploy backend con commit fe1eab7

---

## 🟢 ENDPOINT /api/markets/* (3/10 funzionanti)

### ✅ GET /api/markets

**Status:** ✅ **FUNZIONANTE** (200 OK)  
**Usato da:** Dashboard PA → Gestione Mercati (lista mercati)  
**Response:** JSON con 1 mercato (Grosseto, 160 posteggi)  
**Dati:** Reali da Neon PostgreSQL

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/markets
```

**Response sample:**
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
      "status": "active",
      "latitude": "42.75855600",
      "longitude": "11.11423200"
    }
  ],
  "count": 1
}
```

---

### ✅ GET /api/markets/:id

**Status:** ✅ **FUNZIONANTE** (200 OK)  
**Usato da:** Dashboard PA → Gestione Mercati (dettagli mercato)  
**Response:** JSON con dettagli mercato Grosseto  
**Dati:** Reali da Neon PostgreSQL

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/markets/1
```

**Response sample:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "GR001",
    "name": "Mercato Grosseto",
    "municipality": "Grosseto",
    "days": "Martedì, Giovedì",
    "total_stalls": 160,
    "status": "active",
    "latitude": "42.75855600",
    "longitude": "11.11423200"
  }
}
```

---

### ✅ GET /api/markets/:id/stalls

**Status:** ✅ **FUNZIONANTE** (200 OK)  
**Usato da:** Dashboard PA → Gestione Posteggi (lista posteggi per mercato)  
**Response:** JSON con 160 posteggi Grosseto  
**Dati:** Reali da Neon PostgreSQL

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/markets/1/stalls
```

**Response sample:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "market_id": 1,
      "number": "1",
      "gis_slot_id": "stall-1",
      "width": "4.00",
      "depth": "7.60",
      "type": "fisso",
      "status": "occupato",
      "orientation": "120.30"
    }
  ],
  "count": 160
}
```

---

### ⚠️ POST /api/markets

**Status:** ⚠️ **NON TESTATO** (richiede body JSON)  
**Usato da:** Dashboard PA → Gestione Mercati (crea mercato)  
**Note:** Endpoint implementato ma non testato (richiede autenticazione?)

---

### ⚠️ PATCH /api/markets/:id

**Status:** ⚠️ **NON TESTATO** (richiede body JSON)  
**Usato da:** Dashboard PA → Gestione Mercati (aggiorna mercato)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ DELETE /api/markets/:id

**Status:** ⚠️ **NON TESTATO** (richiede autenticazione?)  
**Usato da:** Dashboard PA → Gestione Mercati (elimina mercato)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ GET /api/markets/:marketId/companies

**Status:** ⚠️ **NON TESTATO**  
**Usato da:** Dashboard PA → Gestione Imprese (lista imprese per mercato)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ POST /api/markets/:marketId/companies

**Status:** ⚠️ **NON TESTATO** (richiede body JSON)  
**Usato da:** Dashboard PA → Gestione Imprese (associa impresa a mercato)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ GET /api/markets/:marketId/concessions

**Status:** ⚠️ **NON TESTATO**  
**Usato da:** Dashboard PA → Gestione Concessioni (lista concessioni per mercato)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ POST /api/markets/:marketId/concessions

**Status:** ⚠️ **NON TESTATO** (richiede body JSON)  
**Usato da:** Dashboard PA → Gestione Concessioni (crea concessione)  
**Note:** Endpoint implementato ma non testato

---

## 🟡 ENDPOINT /api/stalls/* (0/4 funzionanti)

### ⚠️ GET /api/stalls/:id

**Status:** ⚠️ **NON TESTATO**  
**Usato da:** Dashboard PA → Gestione Posteggi (dettagli posteggio)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ PATCH /api/stalls/:id

**Status:** ⚠️ **NON TESTATO** (richiede body JSON)  
**Usato da:** Dashboard PA → Gestione Posteggi (aggiorna posteggio)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ POST /api/stalls

**Status:** ⚠️ **NON TESTATO** (richiede body JSON)  
**Usato da:** Dashboard PA → Gestione Posteggi (crea posteggio)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ DELETE /api/stalls/:id

**Status:** ⚠️ **NON TESTATO** (richiede autenticazione?)  
**Usato da:** Dashboard PA → Gestione Posteggi (elimina posteggio)  
**Note:** Endpoint implementato ma non testato

---

## 🟡 ENDPOINT /api/vendors/* (1/5 funzionanti)

### ✅ GET /api/vendors

**Status:** ✅ **FUNZIONANTE** (200 OK)  
**Usato da:** Dashboard PA → Gestione Imprese (lista vendor)  
**Response:** JSON con lista vendor vuota (nessun vendor nel database)  
**Dati:** Reali da Neon PostgreSQL

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/vendors
```

**Response sample:**
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

**Note:** Nessun vendor nel database, ma endpoint funzionante

---

### ⚠️ GET /api/vendors/:id

**Status:** ⚠️ **NON TESTATO**  
**Usato da:** Dashboard PA → Gestione Imprese (dettagli vendor)  
**Note:** Endpoint implementato ma non testato (nessun vendor nel DB)

---

### ⚠️ POST /api/vendors

**Status:** ⚠️ **NON TESTATO** (richiede body JSON)  
**Usato da:** Dashboard PA → Gestione Imprese (crea vendor)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ PATCH /api/vendors/:id

**Status:** ⚠️ **NON TESTATO** (richiede body JSON)  
**Usato da:** Dashboard PA → Gestione Imprese (aggiorna vendor)  
**Note:** Endpoint implementato ma non testato

---

### ⚠️ DELETE /api/vendors/:id

**Status:** ⚠️ **NON TESTATO** (richiede autenticazione?)  
**Usato da:** Dashboard PA → Gestione Imprese (elimina vendor)  
**Note:** Endpoint implementato ma non testato

---

## 🟢 ENDPOINT /api/gis/* (2/2 funzionanti)

### ✅ GET /api/gis/health

**Status:** ✅ **FUNZIONANTE** (200 OK)  
**Usato da:** Dashboard PA → Health check GIS  
**Response:** `{"status":"ok"}`  
**Dati:** Health check

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/gis/health
```

---

### ✅ GET /api/gis/market-map

**Status:** ✅ **FUNZIONANTE** (200 OK)  
**Usato da:** Dashboard PA → Mappa mercato Grosseto  
**Response:** GeoJSON con 160 posteggi + markers + areas  
**Dati:** Reali da file `editor-v3-FINAL-CORRECT.json`

**Test:**
```bash
curl https://mihub.157-90-29-66.nip.io/api/gis/market-map
```

**Response sample:**
```json
{
  "success": true,
  "data": {
    "stalls_geojson": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[11.114, 42.758], ...]]
          },
          "properties": {
            "number": 1,
            "orientation": 120.3,
            "kind": "slot",
            "status": "occupied",
            "dimensions": "4m × 7.6m"
          }
        }
      ]
    }
  }
}
```

---

## 🚨 Problemi Critici Identificati

### 1. ❌ Endpoint /api/dmsHub/* NON deployati (5/5 rotti)

**Causa:** Backend Hetzner non ha commit fe1eab7  
**Impatto:** Dashboard PA → Gestione Mercati/Posteggi/Imprese/Concessioni NON funzionano  
**Soluzione:** Deploy backend con commit fe1eab7 (endpoint deploy interno o webhook)

---

### 2. ⚠️ Endpoint POST/PATCH/DELETE non testati (15/26)

**Causa:** Test richiede body JSON e possibile autenticazione  
**Impatto:** Non sappiamo se funzionano davvero  
**Soluzione:** Test con body JSON e autenticazione (se richiesta)

---

### 3. ⚠️ Database vendors vuoto

**Causa:** Nessun vendor inserito nel database  
**Impatto:** Dashboard PA → Gestione Imprese mostra lista vuota  
**Soluzione:** Popolare database con vendor di test o reali

---

## 📋 Tabella Riassuntiva

| Metodo | Path | Status | Note | Usato da |
|--------|------|--------|------|----------|
| GET | `/api/dmsHub/markets/list` | ❌ ROTTO (404) | Deploy fe1eab7 richiesto | Gestione Mercati |
| GET | `/api/dmsHub/markets/getById` | ❌ ROTTO (404) | Deploy fe1eab7 richiesto | Gestione Mercati |
| GET | `/api/dmsHub/stalls/listByMarket` | ❌ ROTTO (404) | Deploy fe1eab7 richiesto | Gestione Posteggi |
| GET | `/api/dmsHub/vendors/list` | ❌ ROTTO (404) | Deploy fe1eab7 richiesto | Gestione Imprese |
| GET | `/api/dmsHub/concessions/list` | ❌ ROTTO (404) | Deploy fe1eab7 richiesto | Gestione Concessioni |
| GET | `/api/markets` | ✅ FUNZIONANTE (200) | 1 mercato Grosseto | Gestione Mercati |
| GET | `/api/markets/:id` | ✅ FUNZIONANTE (200) | Dettagli mercato | Gestione Mercati |
| GET | `/api/markets/:id/stalls` | ✅ FUNZIONANTE (200) | 160 posteggi | Gestione Posteggi |
| POST | `/api/markets` | ⚠️ NON TESTATO | Richiede body JSON | Gestione Mercati |
| PATCH | `/api/markets/:id` | ⚠️ NON TESTATO | Richiede body JSON | Gestione Mercati |
| DELETE | `/api/markets/:id` | ⚠️ NON TESTATO | Richiede autenticazione? | Gestione Mercati |
| GET | `/api/markets/:marketId/companies` | ⚠️ NON TESTATO | - | Gestione Imprese |
| POST | `/api/markets/:marketId/companies` | ⚠️ NON TESTATO | Richiede body JSON | Gestione Imprese |
| GET | `/api/markets/:marketId/concessions` | ⚠️ NON TESTATO | - | Gestione Concessioni |
| POST | `/api/markets/:marketId/concessions` | ⚠️ NON TESTATO | Richiede body JSON | Gestione Concessioni |
| GET | `/api/stalls/:id` | ⚠️ NON TESTATO | - | Gestione Posteggi |
| PATCH | `/api/stalls/:id` | ⚠️ NON TESTATO | Richiede body JSON | Gestione Posteggi |
| POST | `/api/stalls` | ⚠️ NON TESTATO | Richiede body JSON | Gestione Posteggi |
| DELETE | `/api/stalls/:id` | ⚠️ NON TESTATO | Richiede autenticazione? | Gestione Posteggi |
| GET | `/api/vendors` | ✅ FUNZIONANTE (200) | Lista vuota (no vendor in DB) | Gestione Imprese |
| GET | `/api/vendors/:id` | ⚠️ NON TESTATO | - | Gestione Imprese |
| POST | `/api/vendors` | ⚠️ NON TESTATO | Richiede body JSON | Gestione Imprese |
| PATCH | `/api/vendors/:id` | ⚠️ NON TESTATO | Richiede body JSON | Gestione Imprese |
| DELETE | `/api/vendors/:id` | ⚠️ NON TESTATO | Richiede autenticazione? | Gestione Imprese |
| GET | `/api/gis/health` | ✅ FUNZIONANTE (200) | Health check | Health check |
| GET | `/api/gis/market-map` | ✅ FUNZIONANTE (200) | GeoJSON 160 posteggi | Mappa mercato |

---

## 🎯 Azioni Immediate Richieste

### 1. Deploy Backend Hetzner (commit fe1eab7)

**Priorità:** 🔴 **CRITICA**  
**Impatto:** 5 endpoint rotti → Dashboard PA non funziona

**Metodo raccomandato:** Endpoint deploy interno
```bash
curl -X POST https://mihub.157-90-29-66.nip.io/api/admin/deploy-backend \
  -H "Content-Type: application/json" \
  -H "x-agent-id: manus" \
  -d '{
    "reason": "Deploy endpoint DMS Hub /api/dmsHub/* da commit fe1eab7",
    "branch": "master"
  }'
```

---

### 2. Test Endpoint POST/PATCH/DELETE

**Priorità:** 🟡 **MEDIA**  
**Impatto:** Non sappiamo se funzionano

**Azioni:**
- Creare test suite con body JSON validi
- Verificare autenticazione richiesta
- Testare ogni endpoint CRUD

---

### 3. Popolare Database Vendors

**Priorità:** 🟡 **MEDIA**  
**Impatto:** Dashboard PA → Gestione Imprese mostra lista vuota

**Azioni:**
- Inserire vendor di test nel database Neon
- Verificare endpoint GET /api/vendors con dati reali

---

## 📝 Note Finali

**Endpoint realmente usabili da MIO e Abacus:**

✅ **Funzionanti (6):**
- GET `/api/markets`
- GET `/api/markets/:id`
- GET `/api/markets/:id/stalls`
- GET `/api/vendors`
- GET `/api/gis/health`
- GET `/api/gis/market-map`

❌ **Rotti (5):**
- GET `/api/dmsHub/markets/list`
- GET `/api/dmsHub/markets/getById`
- GET `/api/dmsHub/stalls/listByMarket`
- GET `/api/dmsHub/vendors/list`
- GET `/api/dmsHub/concessions/list`

⚠️ **Non testati (15):**
- Tutti i POST/PATCH/DELETE
- GET `/api/markets/:marketId/companies`
- GET `/api/markets/:marketId/concessions`
- GET `/api/stalls/:id`
- GET `/api/vendors/:id`

**Raccomandazione:** Aggiornare `api/index.json` e `realEndpoints.ts` per includere solo i 6 endpoint funzionanti fino al deploy backend.

---

**Fine Audit**
