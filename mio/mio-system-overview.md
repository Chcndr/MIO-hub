# Mio System - Overview 2025-11-17

## Struttura Attuale

Repo centrale: `Chcndr/MIO-hub`

Recopopimento principale:
- `tasks/tasks-todo.json`: task da fare
- `tasks/tasks-done.json`: task completati
- `scripts/manus` e `scripts/abacus`: conduitore esterna
- `logs/`*: file di log delle esecuzioni

- `vercel/vercel-commands.json`: deploy
- `mio.config.json`: settagi di configurazione di MIO

## Connettori

Connettori attivi della rete:

- GitHub <--> Zapier <--> Manus
- GitHub <--> RouteLLM Abacus
- Manus --> GitHub (api)
- Manus <--> Zapier (webhook)

## Fase (esempio) dell ecosystema:

1. MIO - Centro logico intelligente (Agente Modulare)
    - Scrive task
    - Salva job
    - Specifica struttura
2. Zapier
    - Detecta via repo modificati
    - Scatena invoci alli agenti
3. Manus
    - Riceve commandi da Zapier
    - Scrive file/log
4. Abacus
    - Script generico chiamato da route llm
    - Invokabile su richiesta da task
