# Internal Traces Format - Documentazione

**Data:** 28 novembre 2025  
**Commit Backend:** b8c3ecc  
**Endpoint:** POST `/api/mihub/orchestrator`

---

## 📋 Panoramica

`internalTraces` è un array di oggetti che traccia i dialoghi interni tra **MIO** (orchestratore) e gli altri agenti (**Abacus**, **Manus**, **Zapier**).

**Obiettivo:** Permettere debug e visualizzazione in tempo reale delle interazioni multi-agente nella **Vista 4 agenti** della Dashboard PA.

---

## 🎯 Scopo

Quando l'utente invia una richiesta a MIO, l'orchestratore può decidere di coinvolgere uno o più agenti specializzati:

- **Abacus**: Query SQL, analisi dati, statistiche
- **Manus**: Operazioni esecutive, deploy, automazioni
- **Zapier**: Integrazioni esterne, webhook, workflow

`internalTraces` registra **ogni passaggio** di questi dialoghi interni, permettendo di:

1. ✅ **Verificare che MIO chiami davvero gli agenti** (non inventi risposte)
2. ✅ **Vedere richieste e risposte** tra MIO e agenti
3. ✅ **Debug problemi** di orchestrazione
4. ✅ **Trasparenza** per l'utente finale

---

## 📦 Formato JSON

### Struttura Response Orchestratore

```json
{
  "success": true,
  "agent": "abacus_sql",
  "conversationId": "conv_abc123",
  "message": "Ho trovato 42 posteggi attivi per il mercato Grosseto (GR001).",
  "internalTraces": [
    {
      "from": "mio",
      "to": "abacus",
      "role": "user",
      "message": "Conta posteggi attivi per mercato GR001",
      "timestamp": "2025-11-28T03:00:00.000Z",
      "meta": {
        "task": "count_active_stalls",
        "params": { "market_code": "GR001" }
      }
    },
    {
      "from": "abacus",
      "to": "mio",
      "role": "assistant",
      "message": "Query eseguita: SELECT COUNT(*) FROM stalls s JOIN markets m ON s.market_id = m.id WHERE m.code = $1 AND s.is_active = $2\nRisultato: 42 posteggi attivi",
      "timestamp": "2025-11-28T03:00:01.500Z",
      "meta": {
        "sqlEndpoint": "/api/abacus/sql/count",
        "sqlQuery": "SELECT COUNT(*) FROM stalls...",
        "sqlResult": 42
      }
    }
  ],
  "error": null
}
```

### Campi Trace Object

| Campo | Tipo | Required | Descrizione |
|-------|------|----------|-------------|
| `from` | `string` | ✅ | Agente mittente (`mio`, `abacus`, `manus`, `zapier`) |
| `to` | `string` | ✅ | Agente destinatario (`mio`, `abacus`, `manus`, `zapier`) |
| `role` | `string` | ✅ | Ruolo messaggio (`user`, `assistant`, `system`, `tool`) |
| `message` | `string` | ✅ | Testo del messaggio (richiesta o risposta) |
| `timestamp` | `string` | ✅ | ISO 8601 timestamp (es. `2025-11-28T03:00:00.000Z`) |
| `meta` | `object` | ❌ | Metadati aggiuntivi (task, params, sqlQuery, etc.) |

---

## 🔄 Flusso Dati

### Scenario: User chiede conteggio posteggi

**1. User → MIO (Chat Principale)**

```
User: "Quanti posteggi attivi ci sono a Grosseto?"
```

**2. MIO → Orchestratore Backend**

```http
POST /api/mihub/orchestrator
{
  "mode": "auto",
  "message": "Quanti posteggi attivi ci sono a Grosseto?",
  "conversationId": "conv_abc123"
}
```

**3. Orchestratore determina agente: `abacus_sql`**

**4. Orchestratore chiama Abacus SQL:**

```javascript
// Backend: routes/orchestrator.js (riga 254-272)

// Traccia richiesta MIO → Abacus
internalTraces.push({
  from: 'mio',
  to: 'abacus',
  role: 'user',
  message: `Conta posteggi attivi per mercato ${market_code}`,
  timestamp: new Date().toISOString(),
  meta: { task: 'count_active_stalls', params: { market_code: 'GR001' } }
});

// Esegue query SQL
const countResponse = await axios.post('/api/abacus/sql/count', {...});
const sqlResult = countResponse.data.data.count; // 42

// Traccia risposta Abacus → MIO
internalTraces.push({
  from: 'abacus',
  to: 'mio',
  role: 'assistant',
  message: `Query eseguita: ${sqlQuery}\nRisultato: ${sqlResult} posteggi attivi`,
  timestamp: new Date().toISOString(),
  meta: { sqlEndpoint: '/api/abacus/sql/count', sqlQuery, sqlResult }
});
```

**5. Response con internalTraces:**

```json
{
  "success": true,
  "agent": "abacus_sql",
  "conversationId": "conv_abc123",
  "message": "Ho trovato 42 posteggi attivi per il mercato Grosseto (GR001).",
  "internalTraces": [
    { "from": "mio", "to": "abacus", "role": "user", "message": "Conta posteggi attivi per mercato GR001", ... },
    { "from": "abacus", "to": "mio", "role": "assistant", "message": "Query eseguita: ...\nRisultato: 42 posteggi attivi", ... }
  ]
}
```

**6. Frontend (Vista 4 Agenti) mostra dialoghi:**

**Card MIO:**
```
mio → abacus
Conta posteggi attivi per mercato GR001
03:00
```

**Card Abacus:**
```
mio → abacus
Conta posteggi attivi per mercato GR001
03:00

abacus → mio
Query eseguita: SELECT COUNT(*)...
Risultato: 42 posteggi attivi
03:00
```

---

## 📝 Esempi per Agente

### Abacus SQL (count_active_stalls)

**Request:**
```json
{
  "mode": "manual",
  "targetAgent": "abacus_sql",
  "message": "Conta posteggi attivi per mercato Grosseto",
  "task": "count_active_stalls",
  "params": { "market_code": "GR001" }
}
```

**Response internalTraces:**
```json
[
  {
    "from": "mio",
    "to": "abacus",
    "role": "user",
    "message": "Conta posteggi attivi per mercato GR001",
    "timestamp": "2025-11-28T03:00:00.000Z",
    "meta": {
      "task": "count_active_stalls",
      "params": { "market_code": "GR001" }
    }
  },
  {
    "from": "abacus",
    "to": "mio",
    "role": "assistant",
    "message": "Query eseguita: SELECT COUNT(*) FROM stalls s JOIN markets m ON s.market_id = m.id WHERE m.code = $1 AND s.is_active = $2\nRisultato: 42 posteggi attivi",
    "timestamp": "2025-11-28T03:00:01.500Z",
    "meta": {
      "sqlEndpoint": "/api/abacus/sql/count",
      "sqlQuery": "SELECT COUNT(*) FROM stalls...",
      "sqlResult": 42
    }
  }
]
```

### Manus (deploy backend)

**Request:**
```json
{
  "mode": "auto",
  "message": "Aggiorna CORS per includere mio-hub.me"
}
```

**Response internalTraces (futuro):**
```json
[
  {
    "from": "mio",
    "to": "manus",
    "role": "user",
    "message": "Esegui deploy backend con motivo: Update CORS whitelist to include mio-hub.me",
    "timestamp": "2025-11-28T03:05:00.000Z",
    "meta": {
      "action": "deploy",
      "reason": "Update CORS whitelist to include mio-hub.me"
    }
  },
  {
    "from": "manus",
    "to": "mio",
    "role": "assistant",
    "message": "Deploy completato con successo. Commit bf4dad8 deployato. PM2 restarted.",
    "timestamp": "2025-11-28T03:05:15.000Z",
    "meta": {
      "deployStatus": "success",
      "commit": "bf4dad8",
      "stdout": "=== Deploy Complete ==="
    }
  }
]
```

### Zapier (trigger workflow)

**Request:**
```json
{
  "mode": "auto",
  "message": "Invia notifica Slack per nuovo posteggio"
}
```

**Response internalTraces (futuro):**
```json
[
  {
    "from": "mio",
    "to": "zapier",
    "role": "user",
    "message": "Trigger workflow Slack notification per nuovo posteggio ID 123",
    "timestamp": "2025-11-28T03:10:00.000Z",
    "meta": {
      "workflowId": "zap_slack_notify",
      "stallId": 123
    }
  },
  {
    "from": "zapier",
    "to": "mio",
    "role": "assistant",
    "message": "Workflow Slack notification triggered con successo. Message ID: msg_abc123",
    "timestamp": "2025-11-28T03:10:02.000Z",
    "meta": {
      "zapStatus": "success",
      "messageId": "msg_abc123",
      "channel": "#posteggi"
    }
  }
]
```

---

## 🧪 Test Vista 4 Agenti

### Procedura Test

**1. Apri Dashboard PA → MIO Agent**

**2. Clicca "Vista 4 agenti"**

**3. Nella chat principale MIO, scrivi:**
```
"MIO, chiedi ad Abacus quanti posteggi attivi ci sono a Grosseto"
```

**4. Verifica che nella Vista 4 agenti compaiano:**

**Card MIO:**
```
mio → abacus
Conta posteggi attivi per mercato GR001
[timestamp]
```

**Card Abacus:**
```
mio → abacus
Conta posteggi attivi per mercato GR001
[timestamp]

abacus → mio
Query eseguita: SELECT COUNT(*)...
Risultato: 42 posteggi attivi
[timestamp]
```

**5. Se le card sono vuote:**
- ❌ MIO sta "inventando" risposte senza chiamare Abacus
- ❌ Backend non popola `internalTraces`
- ❌ Frontend non legge `internalTraces` dalla response

---

## 🔧 Implementazione Backend

### File Modificato

**Path:** `/routes/orchestrator.js`  
**Commit:** b8c3ecc

### Modifiche Principali

**1. Inizializzazione array (riga 197):**
```javascript
// Array per tracciare dialoghi interni MIO ↔ Agenti (debug Vista 4 agenti)
const internalTraces = [];
```

**2. Popolamento traces Abacus SQL (riga 254-272):**
```javascript
// Traccia dialogo interno MIO → Abacus
internalTraces.push({
  from: 'mio',
  to: 'abacus',
  role: 'user',
  message: `Conta posteggi attivi per mercato ${market_code}`,
  timestamp: new Date().toISOString(),
  meta: { task, params }
});

// Traccia risposta Abacus → MIO
internalTraces.push({
  from: 'abacus',
  to: 'mio',
  role: 'assistant',
  message: `Query eseguita: ${sqlQuery}\nRisultato: ${sqlResult} posteggi attivi`,
  timestamp: new Date().toISOString(),
  meta: { sqlEndpoint, sqlQuery, sqlResult }
});
```

**3. Inclusione in response SUCCESS (riga 385, 583):**
```javascript
// Abacus SQL
return res.status(200).json({
  success: true,
  agent: 'abacus_sql',
  conversationId: currentConversationId,
  message: sqlResponseMessage,
  internalTraces, // ← Array dialoghi
  error: null,
  data: {...}
});

// Agenti LLM
return res.status(200).json(
  createSuccessResponse(agent, currentConversationId, responseMessage, internalTraces)
);
```

---

## 🎨 Implementazione Frontend

### File Modificato

**Path:** `/client/src/components/multi-agent/MultiAgentChatView.tsx`  
**Commit:** 3f148e2

### Logica Filtro Traces

```typescript
const getTracesForAgent = (agent: AgentType): InternalTrace[] => {
  return internalTraces.filter(
    (trace) => trace.from === agent || trace.to === agent
  );
};
```

**Esempio:**
- Agente: `abacus`
- Traces filtrati: Tutti i messaggi dove `from === 'abacus'` O `to === 'abacus'`

### Rendering Card

```tsx
{getTracesForAgent(agent).map((trace, idx) => (
  <div key={idx} className="mb-2">
    <div className="text-xs text-[#e8fbff]/40">
      {trace.from} → {trace.to}
    </div>
    <div className="text-sm text-[#e8fbff]">
      {trace.message}
    </div>
    <div className="text-xs text-[#e8fbff]/30 mt-1">
      {formatTimestamp(trace.timestamp)}
    </div>
  </div>
))}
```

---

## ✅ Checklist Implementazione

- [x] Array `internalTraces` inizializzato in orchestratore
- [x] Popolato per Abacus SQL `count_active_stalls`
- [x] Incluso in response SUCCESS (abacus_sql, LLM agents)
- [x] Formato JSON documentato
- [x] Frontend MultiAgentChatView legge `internalTraces`
- [x] Filtro traces per agente implementato
- [x] Rendering card Vista 4 agenti
- [ ] Popolato per Manus (deploy, operazioni)
- [ ] Popolato per Zapier (workflow, integrazioni)
- [ ] Test end-to-end con richieste reali
- [ ] Documentazione formato in blueprint

---

## 🚀 Prossimi Step

**Versione avanzata:**

1. **Popolare traces per Manus:**
   - Deploy backend
   - Operazioni esecutive
   - Chiamate API esterne

2. **Popolare traces per Zapier:**
   - Trigger workflow
   - Webhook calls
   - Integrazioni esterne

3. **Traces multi-hop:**
   - MIO → Abacus → Manus (chain)
   - Gestione errori in traces
   - Retry logic visibile

4. **Export traces:**
   - Download JSON
   - Timeline visualization
   - Performance metrics

---

**Fine Documentazione**
