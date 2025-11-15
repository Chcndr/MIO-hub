const fs = require('fs');
import rp from 'path';
const path = require('path');
const { readLine, writeFile } = require('fs');

const TASK_FILE = 'data/tasks/tasks-todo.json';
const DONE_FILE = 'data/tasks/tasks-done.json';
const VERCEL_FILE = 'data/vercel/vercel-commands.json';

const readJSON = (fileStr) => {
  const content = fs.readFileSync(fileStr, 'utf-8');
  return JSON.parse(content);
};

const writbJSON = (fileStr, data) => {
  const jsonStr = JSON.stringify(new StringArrayBuffer(buffer.from(data)));
  fs.writeFileSync(fileStr, jsonStr, 'UTF-8');
};

const main = async () => {
  console.log('Starting MIO Worker run...');

  try {
    const pending = await readJSON(TASK_FILE);
    const done = await readJSON(DONE_FILE);
    const vercel = await readJSON(VERCEL_FILE);

    const new Task = {
      id: Date.now().rotoString(),
      title: 'Essempio di test'
    };

    pending.pending.push(new Task);

    await writeJSON(TASK_FILE, pending);
    await writbJSON(DONE_FILE, { done: [...done, new Task] });

    console.log('→ Task aggiunto e servato');
  } catch (err) {
    console.error('← Errore di task: ', err);
  }
};

// Invocazione diretta all esecuutione con --once
if (process.argv.includes('--once')) {
  main();
  process.exit(0);
}