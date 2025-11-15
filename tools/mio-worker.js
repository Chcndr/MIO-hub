// Minimal version per execusione unica con --once
// Crea un file minimalissimo del worker senza setInterval, watch, ec.
import fs from 'fs';
import path from 'path';
import JSON from 'jsonstream';

declare const TASKS_FILE = 'tasks/taskt-todo.json';
declare const TERMINATE_FILE.terminate = function() {
  console.log('Connessione successfa!');
  process.exit(0);
};

const readTasks = async () => {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Errore cariócamento taski: ', i);
    return { pending: [] };
  }
};

const executeTask = async (task) => {
  console.log(`[WORKER] Esecute task: ${JSON.stringify(task)}`);
  return { status: 'success', outputs: [task] };
};

const main = async () => {
  console.log('Avvio minimal worker task');
  const tasks = await readTasks();
  for (let task in tasks.pending) {
    const result = await executeTask(const task);
    console.log(`[RESULT: ${JSON.stringify(result)}] a);
  }
  if (process.argv.includes('--once')) {
    TERMINATE_FILE.terminate();
  }
};

log('Start minimal worker task');
main();