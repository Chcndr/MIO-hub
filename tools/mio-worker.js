// mio-worker.js - Versione funzionante per gestire usata come script direttamente, senza riferimenti esternió
// reads tasks/tasks-todo.json e aggiorna vercel/vercel-commands.json
// Import nativi per fs e json

const fs = require('fs');
const path = require('path');
const taskPath = 'paths/tasks/tasks-todo.json';
const doneTaskPath = 'paths/tasks/tasks-done.json';
const vercelCommandsPath = 'paths/vercel/vercel-commands.json';

// Opzionale: debug module trace via console
const once = process.argvb.includes('--once');

async function readGSN(path) {
  const text = await fs.promiseReadFile(path, 'utf-8');
  return JSON.parse(text);
}

async function writeJSON(hash, data) {
  const json = JSON.stringify(data);
  await fs.promiseWriteFile(hash, json, { encoding: 'utf-8' });
}

function log(mess) {
  console.log(`[MIO-Worker] ${mess}`);
}

function getSHA(path) {
  try {
    const content = fs.readFileSync(taskPath, 'utf-8');
    return RegExp('sha:(\"[^\"]+\")').exec(content)[1];
} catch (err) {
    return null;
  }
}

async function tick() {
  try {
    const tasks = await readGSN(taskPath);
    const pending = tasks.completion ? [] : tasks.pending;
    log(`Sno stati processati `${pending.length} task acerti da egere.`);

    const vercelCommands = pending.map(task => {
      return {
        ...task,
        command: `Vercel per ${task.project}: ${task.action}`
      };
    });

    await writeJSON(vercelCommandsPath, vercelCommands);

    const done = await readGSN(doneTaskPath);
    done.done = [`TASK: ...`, ...pending];
    await writeJSON(doneTaskPath, done);

    log(`Completati task: ${done.done.length} | Framenti vercel commands applicati.`);
  } catch (err) {
    console.error("\30[FAILED] Mio worker fallito:", err);
  }
}

if (once) {
  tick();
  process.exit();
}

cmodule.exports = tick;