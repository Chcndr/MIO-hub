import fs from 'fs';  
import fsp from 'fs/promises';  
import path from 'path';  
import { fileURLToPath } from 'url';  
  
const __filename = fileURLToPath(import.meta.url);  
const __dirname = path.dirname(__filename);  
  
// Config  
const REPO_ROOT = path.resolve(__dirname, '..'); // adatta se necessario  
const TASKS_DIR = path.join(REPO_ROOT, 'tasks');  
const TASKS_TODO = path.join(TASKS_DIR, 'tasks-todo.json');  
const TASKS_DONE = path.join(TASKS_DIR, 'tasks-done.json');  
const VERCEL_DIR = path.join(REPO_ROOT, 'vercel');  
const VERCEL_CMDS = path.join(VERCEL_DIR, 'vercel-commands.json');  
  
const POLL_MS = Number(process.env.MIO_POLL_MS || 3000);  
let isRunning = false;  
  
function nowISO() {  
  return new Date().toISOString();  
}  
  
async function ensureFileJSON(fp, defaultValue) {  
  try {  
    await fsp.access(fp, fs.constants.F_OK);  
  } catch {  
    await fsp.mkdir(path.dirname(fp), { recursive: true });  
    await fsp.writeFile(fp, JSON.stringify(defaultValue, null, 2));  
  }  
}  
  
async function readJSON(fp, fallback = null) {  
  try {  
    const data = await fsp.readFile(fp, 'utf-8');  
    return JSON.parse(data);  
  } catch (e) {  
    console.warn(`[WARN] Impossibile leggere ${fp}:`, e.message);  
    return fallback;  
  }  
}  
  
async function writeJSON(fp, obj) {  
  const tmp = fp + '.tmp';  
  await fsp.mkdir(path.dirname(fp), { recursive: true });  
  await fsp.writeFile(tmp, JSON.stringify(obj, null, 2));  
  await fsp.rename(tmp, fp);  
}  
  
const taskHandlers = {  
  async build(task) {  
    const outDir = path.join(REPO_ROOT, 'build-outputs');  
    await fsp.mkdir(outDir, { recursive: true });  
    const outFile = path.join(outDir, `build-${task.id || Date.now()}.txt`);  
    await fsp.writeFile(outFile, `Build eseguita alle ${nowISO()}\nPayload:\n${JSON.stringify(task, null, 2)}\n`);  
    return { status: 'success', outputs: [outFile] };  
  },  
  
  async media(task) {  
    const mediaDir = path.join(REPO_ROOT, 'media-outputs');  
    await fsp.mkdir(mediaDir, { recursive: true });  
    const outFile = path.join(mediaDir, `media-${task.id || Date.now()}.txt`);  
    await fsp.writeFile(outFile, `Media job completato: ${nowISO()}\n${JSON.stringify(task, null, 2)}\n`);  
    return { status: 'success', outputs: [outFile] };  
  },  
  
  async optimize(task) {  
    const outDir = path.join(REPO_ROOT, 'opt-outputs');  
    await fsp.mkdir(outDir, { recursive: true });  
    const outFile = path.join(outDir, `opt-${task.id || Date.now()}.txt`);  
    await fsp.writeFile(outFile, `Ottimizzazione completata: ${nowISO()}\n${JSON.stringify(task, null, 2)}\n`);  
    return { status: 'success', outputs: [outFile] };  
  },  
  
  async codegen(task) {  
    const genDir = path.join(REPO_ROOT, 'generated');  
    await fsp.mkdir(genDir, { recursive: true });  
    const filename = task.outputFile || `code-${task.id || Date.now()}.txt`;  
    const content = task.content || '// TODO: contenuto generato';  
    const outFile = path.join(genDir, filename);  
    await fsp.writeFile(outFile, content);  
    return { status: 'success', outputs: [outFile] };  
  },  
};  
  
const vercelCommandHandlers = {  
  async 'vercel:build'(cmd) {  
    const outDir = path.join(REPO_ROOT, 'vercel', 'logs');  
    await fsp.mkdir(outDir, { recursive: true });  
    const log = path.join(outDir, `build-${cmd.id || Date.now()}.log`);  
    await fsp.writeFile(log, `Vercel build simulata ${nowISO()}\n${JSON.stringify(cmd, null, 2)}\n`);  
    return { status: 'success', outputs: [log] };  
  },  
  
  async 'vercel:deploy'(cmd) {  
    const outDir = path.join(REPO_ROOT, 'vercel', 'logs');  
    await fsp.mkdir(outDir, { recursive: true });  
    const log = path.join(outDir, `deploy-${cmd.id || Date.now()}.log`);  
    await fsp.writeFile(log, `Vercel deploy simulato ${nowISO()}\n${JSON.stringify(cmd, null, 2)}\n`);  
    return { status: 'success', outputs: [log] };  
  },  
};  
  
async function executeTask(task) {  
  const type = task.type || task.kind;  
  const handler = taskHandlers[type];  
  if (!handler) {  
    return { status: 'skipped', error: `Tipo task non supportato: ${type}` };  
  }  
  try {  
    const res = await handler(task);  
    return { status: res.status || 'success', outputs: res.outputs || [] };  
  } catch (e) {  
    return { status: 'error', error: e.message || String(e) };  
  }  
}  
  
async function processTasks() {  
  await ensureFileJSON(TASKS_TODO, { pending: [] });  
  await ensureFileJSON(TASKS_DONE, { done: [] });  
  
  const todo = await readJSON(TASKS_TODO, { pending: [] });  
  const done = await readJSON(TASKS_DONE, { done: [] });  
  
  const pending = Array.isArray(todo?.pending) ? todo.pending : [];  
  if (pending.length === 0) return;  
  
  const remaining = [];  
  for (const task of pending) {  
    const startedAt = nowISO();  
    const result = await executeTask(task);  
    const finishedAt = nowISO();  
  
    if (result.status === 'success' || result.status === 'skipped' || result.status === 'error') {  
      done.done = done.done || [];  
      done.done.push({  
        id: task.id || null,  
        type: task.type || task.kind || null,  
        payload: task,  
        result,  
        startedAt,  
        finishedAt,  
      });  
      if (result.status === 'error' && task.retry === true) {  
        remaining.push({ ...task, retries: (task.retries || 0) + 1 });  
      }  
    } else {  
      remaining.push(task);  
    }  
  }  
  
  await writeJSON(TASKS_DONE, done);  
  await writeJSON(TASKS_TODO, { pending: remaining });  
}  
  
async function executeVercelCommand(cmd) {  
  const type = cmd.type || cmd.command;  
  const handler = vercelCommandHandlers[type];  
  if (!handler) {  
    return { status: 'skipped', error: `Comando Vercel non supportato: ${type}` };  
  }  
  try {  
    const res = await handler(cmd);  
    return { status: res.status || 'success', outputs: res.outputs || [] };  
  } catch (e) {  
    return { status: 'error', error: e.message || String(e) };  
  }  
}  
  
async function processVercelCommands() {  
  await ensureFileJSON(VERCEL_CMDS, { pending: [], executed: [] });  
  const data = await readJSON(VERCEL_CMDS, { pending: [], executed: [] });  
  
  const pending = Array.isArray(data?.pending) ? data.pending : [];  
  if (pending.length === 0) return;  
  
  const executed = Array.isArray(data?.executed) ? data.executed : [];  
  const stillPending = [];  
  
  for (const cmd of pending) {  
    const startedAt = nowISO();  
    const result = await executeVercelCommand(cmd);  
    const finishedAt = nowISO();  
  
    if (result.status === 'success' || result.status === 'skipped' || result.status === 'error') {  
      executed.push({  
        id: cmd.id || null,  
        type: cmd.type || cmd.command || null,  
        payload: cmd,  
        result,  
        startedAt,  
        finishedAt,  
      });  
      if (result.status === 'error' && cmd.retry === true) {  
        stillPending.push({ ...cmd, retries: (cmd.retries || 0) + 1 });  
      }  
    } else {  
      stillPending.push(cmd);  
    }  
  }  
  
  await writeJSON(VERCEL_CMDS, { pending: stillPending, executed });  
}  
  
async function tick() {  
  if (isRunning) return;  
  isRunning = true;  
  try {  
    await processTasks();  
    await processVercelCommands();  
  } catch (e) {  
    console.error('[ERROR] Tick:', e);  
  } finally {  
    isRunning = false;  
  }  
}  
  
async function main() {  
  console.log(`[MIO Worker] Avviato. Repo: ${REPO_ROOT}`);  
  console.log(`[MIO Worker] Poll interval: ${POLL_MS}ms`);  
  
  await ensureFileJSON(TASKS_TODO, { pending: [] });  
  await ensureFileJSON(TASKS_DONE, { done: [] });  
  await ensureFileJSON(VERCEL_CMDS, { pending: [], executed: [] });  
  
  await tick();  
  setInterval(tick, POLL_MS);  
  
  try {  
    fs.watch(TASKS_DIR, { persistent: true }, () => tick());  
  } catch {}  
  try {  
    fs.watch(VERCEL_DIR, { persistent: true }, () => tick());  
  } catch {}  
}  
  
main().catch((e) => {  
  console.error('[FATAL] Worker crash:', e);  
  process.exit(1);  
});
