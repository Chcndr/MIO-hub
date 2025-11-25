# Schema PDND: Imprese, SCIA/SUAP, DURC

**Data creazione:** 25 Novembre 2025  
**Database:** Neon PostgreSQL (neondb)  
**Migrazione:** `migrations/20251125_add_pdnd_tables.sql`

Questo documento descrive lo schema delle tabelle create per preparare l'integrazione con la **Piattaforma Digitale Nazionale Dati (PDND)** per la gestione di imprese, concessioni SUAP e regolarità contributiva (DURC).

---

## 1. dms_companies (Imprese – Registro Imprese)

Tabella che contiene l'anagrafica delle imprese derivata dal **Registro Imprese** tramite PDND.

### Schema Tabella

| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificativo univoco interno |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Data creazione record |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Data ultimo aggiornamento |
| **Identificativi ufficiali** |
| `codice_fiscale` | text | NOT NULL | Codice fiscale impresa (obbligatorio) |
| `partita_iva` | text | | Partita IVA |
| `numero_rea` | text | | Numero REA (Repertorio Economico Amministrativo) |
| `cciaa_sigla` | text | | Sigla Camera di Commercio (es. "GR" per Grosseto) |
| **Anagrafica base** |
| `denominazione` | text | NOT NULL | Ragione sociale / denominazione impresa |
| `forma_giuridica` | text | | Forma giuridica (es. "SRL", "SPA", "Ditta individuale") |
| `stato_impresa` | text | | Stato impresa (es. "Attiva", "Cessata", "Sospesa") |
| **Sede legale** |
| `indirizzo_via` | text | | Via sede legale |
| `indirizzo_civico` | text | | Numero civico |
| `indirizzo_cap` | text | | CAP |
| `indirizzo_comune` | text | | Comune |
| `indirizzo_provincia` | text | | Provincia (sigla) |
| `indirizzo_stato` | text | | Stato (es. "IT") |
| `pec` | text | | Indirizzo PEC |
| **Classificazione attività** |
| `codice_ateco` | text | | Codice ATECO attività principale |
| `descrizione_ateco` | text | | Descrizione attività ATECO |
| **Stato amministrativo** |
| `data_iscrizione_ri` | timestamptz | | Data iscrizione Registro Imprese |
| `data_cancellazione_ri` | timestamptz | | Data cancellazione Registro Imprese |
| `flag_impresa_artigiana` | boolean | | TRUE se impresa artigiana |
| `flag_startup_innovativa` | boolean | | TRUE se startup innovativa |

### Indici

- **`dms_companies_pkey`**: PRIMARY KEY su `id`
- **`idx_companies_cf`**: Indice su `codice_fiscale` (ricerca veloce per CF)
- **`idx_companies_piva`**: Indice su `partita_iva` (ricerca veloce per P.IVA)
- **`idx_companies_rea`**: Indice composito su `(numero_rea, cciaa_sigla)` (ricerca veloce per REA)

### Fonte Dati

I dati di questa tabella saranno popolati tramite:
- **PDND** → API Registro Imprese
- Sincronizzazione periodica o on-demand

---

## 2. dms_suap_instances (SCIA / SUAP / Concessioni Mercato)

Tabella che rappresenta le **istanze SUAP** (Sportello Unico Attività Produttive) e le **SCIA** (Segnalazione Certificata di Inizio Attività) collegate a mercati e posteggi del sistema DMS.

### Schema Tabella

| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificativo univoco interno |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Data creazione record |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Data ultimo aggiornamento |
| **Collegamenti** |
| `company_id` | uuid | NOT NULL, FOREIGN KEY → dms_companies(id) | Impresa titolare della concessione |
| `market_id` | text | | Codice mercato DMS (es. "GRO001") - collegamento logico a `markets.code` |
| `stall_id` | text | | Codice posteggio DMS - collegamento logico a `stalls.id` |
| **Identificativi SUAP / SSU** |
| `cui` | text | NOT NULL | Codice Univoco Istanza (CUI) - identificativo nazionale |
| `codice_procedimento` | text | NOT NULL | Codice procedimento amministrativo |
| `evento_vita` | text | NOT NULL | Evento vita impresa: "APERTURA", "SUBINGRESSO", "MODIFICA", "CESSAZIONE" |
| `regime_amministrativo` | text | NOT NULL | Regime: "SCIA", "Comunicazione", "Autorizzazione", "Concessione" |
| **Stato procedimento** |
| `stato_procedimento` | text | NOT NULL | Stato: "presentata", "protocollata", "istruttoria", "conclusa", "sospesa" |
| `data_presentazione` | timestamptz | | Data presentazione istanza |
| `data_protocollazione` | timestamptz | | Data protocollazione |
| `data_inizio_attivita` | timestamptz | | Data inizio attività (efficacia SCIA) |
| `data_fine_concessione` | timestamptz | | Data scadenza concessione |
| `data_ultimo_aggiornamento` | timestamptz | | Data ultimo aggiornamento stato |
| **Dati specifici concessione mercato** |
| `tipo_concessione` | text | | Tipo: "fisso", "spunta", "temporanea" |
| `giorno_settimana` | text | | Giorno mercato (es. "Martedì") |
| `orario_inizio` | text | | Orario inizio (es. "07:00") |
| `orario_fine` | text | | Orario fine (es. "14:00") |
| `superficie_mq` | numeric | | Superficie posteggio in mq |
| `codice_area` | text | | Codice area mercato |
| `sezione_mercato` | text | | Sezione mercato (es. "Alimentare", "Non alimentare") |
| **Link documentali** |
| `url_pratica_suap` | text | | URL pratica su portale SUAP |
| `url_documento_autorizzazione` | text | | URL documento autorizzazione/concessione |

### Indici

- **`dms_suap_instances_pkey`**: PRIMARY KEY su `id`
- **`idx_suap_cui`**: Indice su `cui` (ricerca veloce per CUI)
- **`idx_suap_company`**: Indice su `company_id` (ricerca istanze per impresa)
- **`idx_suap_market`**: Indice su `market_id` (ricerca istanze per mercato)
- **`idx_suap_stall`**: Indice su `stall_id` (ricerca istanze per posteggio)

### Fonte Dati

I dati di questa tabella saranno popolati tramite:
- **SUAP/SSU** → API Sportello Unico (se disponibile via PDND)
- Import manuale da sistemi comunali
- Integrazione con portali SUAP regionali

---

## 3. dms_durc_snapshots (DURC – INPS/INAIL via PDND)

Tabella che contiene **snapshot di regolarità contributiva** (DURC - Documento Unico di Regolarità Contributiva) ottenuti tramite PDND da INPS/INAIL.

### Schema Tabella

| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificativo univoco interno |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Data creazione record (data richiesta DURC) |
| **Collegamenti** |
| `company_id` | uuid | NOT NULL, FOREIGN KEY → dms_companies(id) | Impresa a cui si riferisce il DURC |
| **Identificativi e richiesta** |
| `richiesta_identificativo` | text | NOT NULL | CF o P.IVA usata per richiedere il DURC |
| `numero_protocollo_durc` | text | | Numero protocollo DURC (se disponibile) |
| `ente_emittente` | text | | Ente emittente: "INPS", "INAIL", "DURC_online" |
| **Esito** |
| `esito_regolarita` | text | NOT NULL | Esito: "REGOLARE", "NON_REGOLARE", "IN_VERIFICA" |
| **Date** |
| `data_emissione` | timestamptz | | Data emissione DURC |
| `data_scadenza` | timestamptz | | Data scadenza DURC |
| `valido_al` | timestamptz | | Data fino a cui il DURC è valido |
| **Metadati** |
| `fonte` | text | | Fonte dati (es. "PDND_DURC", "INPS_API") |
| `raw_payload` | jsonb | | Risposta grezza API PDND (per audit/debug) |

### Indici

- **`dms_durc_snapshots_pkey`**: PRIMARY KEY su `id`
- **`idx_durc_company`**: Indice su `company_id` (ricerca DURC per impresa)
- **`idx_durc_esito`**: Indice su `esito_regolarita` (filtro per regolarità)

### Fonte Dati

I dati di questa tabella saranno popolati tramite:
- **PDND** → API DURC (INPS/INAIL)
- Richiesta on-demand o verifica periodica
- Snapshot storico per audit

---

## 4. Relazioni Logiche

### Relazioni tra Tabelle

```
dms_companies (1) ←→ (N) dms_suap_instances
    ↓
    └─ company_id (FK)

dms_companies (1) ←→ (N) dms_durc_snapshots
    ↓
    └─ company_id (FK)
```

### Relazioni con Tabelle DMS Esistenti

**Collegamenti logici (NO Foreign Key rigide):**

```
dms_suap_instances.market_id → markets.code
    ↓
    Esempio: "GRO001" (Mercato Grosseto Centro)

dms_suap_instances.stall_id → stalls.id
    ↓
    Esempio: "uuid-posteggio-123"
```

**Perché NO Foreign Key?**
- I campi `market_id` e `stall_id` sono **collegamenti logici** per evitare vincoli rigidi tra sistemi SUAP e DMS
- Permette flessibilità per gestire istanze SUAP non ancora collegate a mercati/posteggi specifici
- Facilita import dati da sistemi esterni senza blocchi su integrità referenziale

### Diagramma Relazioni

```
┌─────────────────┐
│ dms_companies   │
│ (Registro Imp.) │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌──────────────────┐   ┌──────────────────┐
│ dms_suap_        │   │ dms_durc_        │
│ instances        │   │ snapshots        │
│ (SCIA/SUAP)      │   │ (DURC)           │
└────┬─────┬───────┘   └──────────────────┘
     │     │
     │     └─ stall_id (logico)
     │
     └─ market_id (logico)
         │
         ▼
    ┌─────────┐
    │ markets │ (tabella esistente)
    └─────────┘
         │
         ▼
    ┌─────────┐
    │ stalls  │ (tabella esistente)
    └─────────┘
```

---

## 5. Uso Previsto

### Popolamento Dati

Le tabelle saranno popolate tramite:

1. **dms_companies** (Registro Imprese)
   - Sincronizzazione periodica via PDND
   - Import iniziale da anagrafica esistente
   - Aggiornamento on-demand quando un operatore cerca un'impresa

2. **dms_suap_instances** (SCIA/SUAP)
   - Import da sistemi SUAP comunali
   - Integrazione con portali SUAP regionali (se disponibili via PDND)
   - Creazione manuale da Dashboard PA per nuove concessioni

3. **dms_durc_snapshots** (DURC)
   - Richiesta automatica via PDND quando un operatore verifica un'impresa
   - Verifica periodica per imprese con concessioni attive
   - Snapshot storico per audit e controlli

### Funzionalità Future

**Dashboard PA → Gestione Mercati → Tab "Imprese / Concessioni"**

La nuova tab utilizzerà queste tabelle per:

1. **Ricerca Imprese**
   - Ricerca per CF, P.IVA, denominazione
   - Visualizzazione anagrafica completa da Registro Imprese

2. **Gestione Concessioni**
   - Visualizzazione istanze SUAP collegate a mercati/posteggi
   - Stato procedimenti amministrativi
   - Scadenze concessioni

3. **Verifica Regolarità**
   - Controllo DURC aggiornato
   - Alert per DURC scaduti o non regolari
   - Storico verifiche

4. **Collegamento Mercati**
   - Associazione istanze SUAP a mercati/posteggi DMS
   - Visualizzazione concessioni per mercato
   - Gestione posteggi fissi/spunta

### Esempio Flusso

```
1. Operatore cerca impresa per CF
   → Query su dms_companies

2. Sistema mostra anagrafica + istanze SUAP
   → JOIN dms_companies + dms_suap_instances

3. Operatore verifica regolarità contributiva
   → Query su dms_durc_snapshots
   → Se snapshot vecchio, richiesta PDND

4. Sistema collega istanza SUAP a posteggio mercato
   → UPDATE dms_suap_instances.market_id, stall_id
```

---

## 6. Note Tecniche

### Migrazione Idempotente

La migrazione SQL usa `CREATE TABLE IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS`, quindi può essere rieseguita senza errori.

### Estensione pgcrypto

La migrazione abilita l'estensione `pgcrypto` per supportare `gen_random_uuid()` come default per i campi `id`.

### Timestamp con Timezone

Tutti i campi data/ora usano `timestamptz` (timestamp with time zone) per garantire consistenza tra fusi orari.

### JSONB per Raw Payload

Il campo `raw_payload` in `dms_durc_snapshots` usa tipo `jsonb` per:
- Memorizzare risposta grezza API PDND
- Supportare query JSON avanzate (se necessario)
- Audit e debug

---

## 7. Prossimi Step

**NON implementati in questa fase:**

- ❌ Endpoint API per CRUD su queste tabelle
- ❌ UI Dashboard PA per visualizzare/modificare dati
- ❌ Integrazione PDND reale (API keys, autenticazione)
- ❌ Logica business per sincronizzazione dati
- ❌ Trigger/stored procedure per aggiornamento automatico

**Questa fase include solo:**
- ✅ Schema database (tabelle + indici)
- ✅ Documentazione blueprint
- ✅ Preparazione fondazione dati per future integrazioni

---

## 8. Riferimenti

**Migrazione SQL:** `/root/mihub-backend-rest/migrations/20251125_add_pdnd_tables.sql`  
**Database:** Neon PostgreSQL (neondb)  
**Data creazione:** 25 Novembre 2025

**Tabelle create:**
- `dms_companies` (23 colonne, 3 indici)
- `dms_suap_instances` (20+ colonne, 4 indici)
- `dms_durc_snapshots` (11 colonne, 2 indici)

**Nomi campi allineati al database reale su Neon.**
