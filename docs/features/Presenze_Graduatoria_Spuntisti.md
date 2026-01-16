> # Funzionalità: Gestione Presenze, Graduatoria e Spuntisti
> 
> **Versione:** 3.60.0
> **Data:** 2026-01-17
> 
> ## 1. Overview
> 
> Questo documento descrive le nuove funzionalità implementate per la gestione delle presenze, la graduatoria degli operatori e la visualizzazione degli spuntisti nei mercati.
> 
> L'obiettivo è fornire agli operatori comunali uno strumento completo per:
> - Visualizzare in tempo reale le presenze di concessionari e spuntisti.
> - Gestire una graduatoria dinamica basata su presenze e anzianità.
> - Identificare rapidamente gli spuntisti con wallet SPUNTA attivo.
> 
> ## 2. Frontend (dms-hub-app-new)
> 
> È stato aggiornato il pannello **"Presenze e Graduatoria"** nella dashboard di gestione mercati.
> 
> ### Tab "Presenze Spuntisti"
> 
> - **Nuova fonte dati:** Il tab ora carica i dati dall'endpoint backend `/api/spuntisti/mercato/:id`.
> - **Visualizzazione dati:** La tabella mostra le seguenti informazioni per ogni spuntista:
>     - Posizione in graduatoria
>     - Nome Impresa
>     - Saldo Wallet SPUNTA
>     - Punteggio graduatoria
>     - Numero di presenze
>     - Data prima presenza
> - **Interfaccia utente:**
>     - Sfondo giallo per distinguere gli spuntisti.
>     - Pulsante "Chiama Turno".
>     - Checkbox "Presente" per la registrazione manuale.
>     - Contatore in fondo alla tabella che riepiloga il numero di spuntisti attivi.
> 
> ## 3. Backend (mihub-backend-rest)
> 
> Sono stati aggiunti 10 nuovi endpoint REST nel file `routes/presenze.js` per supportare le nuove funzionalità.
> 
> ### Endpoint Aggiunti
> 
> | Metodo | Path                                               | Descrizione                                      |
> |--------|----------------------------------------------------|--------------------------------------------------|
> | GET    | `/api/presenze/mercato/:id`                        | Lista presenze per mercato con storico.          |
> | POST   | `/api/presenze/registra`                           | Registra una nuova presenza.                     |
> | POST   | `/api/presenze/checkout`                           | Esegue il checkout di una presenza.              |
> | GET    | `/api/presenze/graduatoria/mercato/:id`            | Ottiene la graduatoria completa per un mercato.  |
> | PUT    | `/api/presenze/graduatoria/aggiorna`               | Aggiorna i dati di un operatore in graduatoria.  |
> | PUT    | `/api/presenze/graduatoria/assenze`                | Aggiorna le assenze non giustificate.            |
> | POST   | `/api/presenze/graduatoria/ricalcola-posizioni`    | Ricalcola le posizioni in graduatoria.           |
> | POST   | `/api/presenze/graduatoria/crea`                   | Crea una nuova voce in graduatoria.              |
> | POST   | `/api/presenze/graduatoria/aggiorna-storico`       | Aggiorna lo storico presenze (popup editabile).  |
> | GET    | `/api/spuntisti/mercato/:id`                       | Lista spuntisti con wallet SPUNTA per mercato.   |
> 
> ## 4. API Discovery (MIO-hub/api/index.json)
> 
> I 10 nuovi endpoint sono stati aggiunti al file `index.json` nel repository MIO-hub, portando il totale a **362 endpoint** monitorati da Guardian.
> 
> Questo garantisce che le nuove API siano visibili nella sezione "Integrazioni" della dashboard e che il loro stato sia costantemente monitorato.
> 
> **Versione API index:** 22
