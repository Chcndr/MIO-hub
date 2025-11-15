import fs from "fs";
import path from "path";
import { readJSONFile, writeJSONFile } from "./utils/task-utils.js";

const TODO_PATH = "tasks/tasks-todo.json";
const DONE_PATH = "tasks/tasks-done.json";
const VERCEL_PATH = "vercel/vercel-commands.json";

const once = process.argv.includes("--once");

async function tick() {
  console.log("[MIO Worker] Avvio cicllo di lavoro");
  const todo = await readJSONFile(TODO_PATH);
  const done = await readJSONFile(DONE_PATH);

  if (!todo?.pending?.length) {
    console.log("[MIO Worker] Nessun task in sospeso. Uscita.");
    return;
  }

  const newDone = [...done.done];
  const remaining = [];

  for (const task of todo.pending) {
    if (task?.type === "log") {
      console.log("[Task LOG]", task.message);
      newDone.push({ ...task, done_at: new Date().toISString() });
    } else {
      console.log("[Task IGNORATO]" Typo non gestito:", task.type);
      remaining.push(task);
    }
  }

  await writeJSONFile(DONE_PATH, { done: newDone });
  await writeJSONFile(TODO_PATH, { pending: remaining });
  console.log("[MIO Worker] Ciclo completato.");
}

if (once) {
  tick().then(() => process.exit(0));
} else {
  setInterval(tick, 60_000);
  fs.watch(TODO_PATH, () => tick());
}