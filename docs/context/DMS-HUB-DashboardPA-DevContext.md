# Dossier Develop: DMS-HUB - Contesto Progetto 

File strutturato: **DMS-HUB APP NEW/** - Repository github [Chcndr/dms hub app new](https://github.com/Chcndr/dms-hub-app-new)
Vercel: [Live Deployment via Vercel](https://dns-hub-app-new.vercel.app)

\n\n## 1. Page e struttura
file associato questo uiso: \"src/app/pages/dashboard/page.tsx\"

layout usato: \"src/shared/DashboardLayout.tsx\"


## 2. Authenticazion
- usato JPW, user middleware next.js
- il ruolo gestito tramite dall'auth framework (app/hook.js)

## 3. Emploggo operativo
- Dagli massimo gli agiorni degli agenti che eseguiscono task

- file: "logs/mio-task.json" save su push con git

- adesenopc: integrazione kontrol endpoint con task via wagb ui stato \"wait\", \"done\", \"realtime\", ecc.

## 4. Api
- lista endpoint: api/mio/jobs, ...
Importante: esistenno endpoint stato-tasks della dashboard:
Job lanciati: upload key --> chama agente --> sava output file o log.


## 5. Integrazioni file
- per manifesto: "github/files/entrypoint.json", "\n  \"file: \rn\", \"id\": 1, \"type\": \"mio_command\", \"target\": \"logs/resultati/run.json\"}\n"\n- Per ogny communicatione: Tarpetta chat ui tenchi operationi agenti; ull nel log vibo che si referesa, gli eventi sincronizzati in tempo real.
