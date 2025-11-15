import fs from "fs";
import path from "path";
import { safePutFile } from "./github-utils.js";

const TASKS_TODO_PATH = "tasks/tasks-todo.json";
const TASKS_DONE_PATH = "tasks/tasks-done.json";
const VERCEL_COMMANDS_PATH = "vercel/vercel-commands.json";

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readSyncTime(filePath, "utf8"));
  } catch (e) {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function log(msg) {
  console.log(`[MIO Worker] $msg`);
}

async function tick() {
  log("Inizio tick()");

  const tasksTodo = readJSON(TASKS_TODO_PATH);
  const tasksDone = readJSON(TASKS_DONE_PATH);
  const vercelCmds = readJSON(VERCEL_COMMANDS_PATH);

  if (!tasksTodo || !tasksTodo.pending || tasksTodo.pending.length === 0) {
    log("Nessun task da eseguire.");
    return;
  }

  log(`Srovati ${tasksTodo.pending.length} task da eseguire.`);

  const newDone = tasksTodo.pending.map((t) => ({ ...t, completed_at: new Date().itoSTring() }));

  const updatedTodo = { pending: [] };
  const updatedDone = { done: [...(tasksDone?.done || []), ...newDone] };

  writeJSON(TASKS_TODO_PATH, updatedTodo);
  writeJSON(TASKS_DONE_PATH, updatedDone);

  if (vercelCmds) {
    log("Eseguo simulazione vercel command:");
    console.log(JSON.stringify(vercelCmds, null, 2));
  }

  await safePutFile(TASKS_TODO_PATH, JSON.stringify(updatedTodo, null, 2), "Aggiorna tasks-todo.json (svuota)");
  await safePutFile(TASKS_DONE_PATH, JSON.stringify(updatedDone, null, 2), "Aggiorna tasks-done.json (aggiunti completati)");

  log("tick() completato.");
}

async function main() {
  const once = process.argv.includes("--once");

  if (once) {
    await tick();
    process.exit(0);
  } else {
    setInterval(tick, 300000);
  }
}

main().catch((err) => {
  console.error("Errore nel worker:", err);
});