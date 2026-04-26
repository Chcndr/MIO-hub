# Master Blueprint MIO-hub - Aggiornamento Modulo Bolkestein (D.Lgs. 59/2010)

**Data Aggiornamento:** 26 Aprile 2026
**Autore:** Manus AI
**Stato:** IMPLEMENTATO E DEPLOYATO IN PRODUZIONE

Questo documento unifica e certifica tutte le modifiche architetturali, backend e frontend apportate al sistema MIO HUB per l'implementazione del modulo "Bandi Bolkestein", completate con successo in data odierna.

---

## 1. Architettura Dati (Database PostgreSQL su Neon)

Il database è stato esteso per supportare la raccolta strutturata dei dati quantitativi necessari al calcolo delle graduatorie proporzionali.

### 1.1 Tabella `suap_bandi`
Gestisce il ciclo di vita dei bandi comunali per l'assegnazione dei posteggi.
* **Campi principali:** `id`, `comune_id`, `mercato_id`, `titolo`, `stato` (BOZZA, APERTO, CHIUSO), `data_apertura`, `data_scadenza`.

### 1.2 Tabella `suap_dati_bolkestein`
Memorizza le dichiarazioni e i requisiti quantitativi estratti dalle pratiche SCIA di tipo Bolkestein. È legata 1:1 alla tabella `suap_pratiche`.
* **Campi quantitativi (Proporzionali):** `num_dipendenti` (Cr. 6), `anni_impresa` (Cr. 7a), `ore_formazione` (Cr. 9.1f).
* **Campi booleani (Punteggi fissi):** `is_microimpresa` (Cr. 8), `impegno_prodotti_tipici` (Cr. 9.1b), `impegno_consegna_domicilio` (Cr. 9.1c), `impegno_progetti_innovativi` (Cr. 9.1d), `impegno_mezzi_green` (Cr. 9.1e).
* **Campi descrittivi (Audit):** `dettagli_prodotti_tipici`, `dettagli_consegna_domicilio`, `dettagli_progetti_innovativi`, `dettagli_mezzi_green`.
* **Campi di output:** `punteggio_calcolato`, `posizione_graduatoria`.

---

## 2. Backend REST API (Node.js/Express su Hetzner)

L'API del SUAP (`/api/suap`) è stata potenziata per gestire l'intero ciclo di vita dei bandi e il calcolo dinamico delle graduatorie.

### 2.1 Endpoint Bandi Implementati
* `GET /api/suap/bandi` - Recupera la lista dei bandi filtrata per `comune_id`.
* `GET /api/suap/bandi/:id` - Dettaglio del singolo bando.
* `POST /api/suap/bandi` - Creazione di un nuovo bando (stato iniziale: BOZZA).
* `PUT /api/suap/bandi/:id` - Modifica bando (inclusa la pubblicazione in stato APERTO).
* `DELETE /api/suap/bandi/:id` - Eliminazione bando (solo se in BOZZA).

### 2.2 Endpoint Graduatoria
* `POST /api/suap/bandi/:id/graduatoria` - Esegue l'algoritmo di calcolo della graduatoria.
  * Identifica il `MAX()` per i criteri proporzionali (dipendenti, anni impresa, ore formazione).
  * Assegna i punteggi proporzionali e somma i punteggi fissi.
  * Risolve le parità favorendo la maggiore anzianità d'impresa.
  * Salva i risultati (`punteggio_calcolato`, `posizione_graduatoria`) nella tabella `suap_dati_bolkestein`.

### 2.3 Integrazione Dati Pratica (`GET /api/suap/pratiche/:id`)
L'endpoint di dettaglio pratica è stato modificato per includere i dati Bolkestein tramite una query `LEFT JOIN` ottimizzata:
* Mappa i campi fisici del DB (`num_dipendenti`, `is_microimpresa`, `impegno_prodotti_tipici`, ecc.) nel formato atteso dal frontend (`bolkestein_dipendenti`, `bolkestein_microimpresa`, `bolkestein_prodotti_tipici`, ecc.).
* Restituisce tutti i 15 campi necessari per la visualizzazione dettagliata lato PA.

---

## 3. Frontend UI/UX (React/Vite su Vercel)

L'interfaccia utente è stata adattata per gestire il doppio ruolo: le Associazioni che presentano le domande e la PA che gestisce i bandi e valuta le pratiche.

### 3.1 Presentazione Domanda (`SciaForm.tsx`)
* Aggiunto il tipo segnalazione **"Bando Bolkestein"** nel radio button iniziale.
* **Logica Condizionale:** Selezionando Bolkestein, le sezioni "Dati Cedente" e "Estremi Atto Notarile" vengono nascoste (non pertinenti).
* **Comune Presentazione:** Trasformato da input testuale a menu a tendina (`Select`) popolato con i comuni registrati a sistema.
* **Sezione Criteri:** Aggiunta una nuova sezione dinamica che mostra un menu a tendina con i bandi in stato `APERTO`. Include tutti i campi di input numerici, checkbox e textarea necessari per raccogliere i dati dei criteri (Cr. 6 - Cr. 9.1f).

### 3.2 Dashboard PA (`BandiBolkesteinPanel.tsx` e `SuapPanel.tsx`)
* Creato il nuovo componente `BandiBolkesteinPanel` integrato nel `SuapPanel` come tab dedicato.
* Il pannello include tre sotto-sezioni:
  1. **Bandi:** Lista dei bandi con badge di stato e contatore domande.
  2. **Crea Bando:** Form per la configurazione di nuovi bandi.
  3. **Graduatorie:** Interfaccia per visualizzare i risultati del calcolo per i bandi chiusi.
* **Vista Dettaglio Pratica:**
  * Nascoste dinamicamente le sezioni "B. Dati Cedente" e "D. Estremi Atto Notarile" per le pratiche di tipo Bolkestein.
  * Aggiunta la nuova sezione **"Dati Bando Bolkestein (D.Lgs. 59/2010)"** (icona Trophy) che mostra in sola lettura tutti i 15 parametri dichiarati dall'impresa e restituiti dal JOIN backend.

---

## 4. Prossimi Sviluppi: Inoppugnabilità e Sicurezza

Per garantire la totale trasparenza e inoppugnabilità legale delle graduatorie, il sistema prevede i seguenti sviluppi futuri:

1. **Audit Trail e Log di Calcolo:** Generazione automatica di un report PDF/JSON non modificabile che documenta il dettaglio matematico del calcolo per ogni singola pratica.
2. **Timestamping e Hashing:** Calcolo dell'hash SHA-256 del payload della pratica al momento dell'invio, per garantire l'immutabilità dei dati dichiarati.
3. **Gestione Avanzata Spareggi:** Implementazione di criteri di tie-breaking secondari automatici (es. ordine cronologico di arrivo della pratica) in caso di parità persistente dopo il controllo dell'anzianità.
4. **Integrazione Identità Digitale:** Supporto SPID/CIE per garantire l'identità certa del dichiarante.

---
*Blueprint generato e certificato da Manus AI - Sistema MIO HUB v9.9.5+*
