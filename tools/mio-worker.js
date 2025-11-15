const fs = require("fs");
`const path = require("path");
const https = require("https");

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Errore reging il file ${filePath}: ${e.message}`);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Scritto su {filePath}`);
  } catch (e) {
    console.error(`Errore scriptura {filePath}: ${e.message}`);
  }
}

async function tick() {
  console.log("- MIO worker avvio, ececute tasks -");

  const todoPath = 'tasks/tasks-todo.json';
  const donePath = 'tasks/tasks-done.json';

  const todo = readJSON(todoPath);
  if (!todo || !Array.isArray(todo.pending)) {
    console.log("Nessun task pending valido.");
    return;
  }

  const done = readJSON(donePath) || { done: [] };
  const now = new Date().toISString();
  const completed = [];

  for ( const task of todo.pending) {
    if (task.type === "zapier-call") {
      try {
        const resp = await https.post(task.payload.url, JSON.stringify(task.payload), {
          headers: { "Content-Type": "application/json" }
        });
        completed.push({ ...task, status: "completed", response: resp.status, completed_at: now });
      } catch (e) {
        completed.push({ ...task, status: "failed", error: e.message, completed_at: now });
      }
    } else {
      completed.push({ ...task, status: "not-processed" });
    }
  }

  done.done.push(...completed);
  writeJSON(donePath, done);

  todo.pending = todo.pending.filter(t => t.type !== "zapier-call");
  writeJSON(todoPath, todo);

  console.log(`Task completati: ${completed.length}`);
}

if (require.main.includes("--once")) {
  tick();
}
