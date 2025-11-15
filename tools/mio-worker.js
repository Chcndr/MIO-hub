const fs = require("fs");
const path = require("path");

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error(`❌ Errore lettura ${filePath}`, e.message);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Scritto ${filePath}`);
  } catch (e) {
    console.error(`❌ Errore scrittura ${filePath}`, e.message);
  }
}

function tick() {
  console.log("🚀 Esecuzione MIO Worker --once");
  const todoPath = "tasks/tasks-todo.json";
  const donePath = "tasks/tasks-done.json";

  const todo = readJSON(todoPath);
  if (!todo || !Array.isArray(todo.pending)) {
    console.log("⚠️ Nessun task valido in pending");
    return;
  }

  const done = readJSON(donePath) || { done: [] };

  const now = new Date().toISOString();
  const completed = todo.pending.map((task) => ({
    ...task,
    completed_at: now,
    status: "completed",
  }));

  done.done.push(...completed);
  writeJSON(donePath, done);

  todo.pending = [];
  writeJSON(todoPath, todo);
  console.log("✅ Tick completato");
}

// Supporto flag --once
if (process.argv.includes("--once")) {
  tick();
  process.exit(0);
}
