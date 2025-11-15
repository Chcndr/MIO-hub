#!/usr/bin/env node
// tools/mio-worker.js

// Command: ntode tools/mio-worker.js --once
// Descrizione: Script questa una volta tasklist gestisce, controlla vercel e aggiorna vercel/commands.json.

const fs = require('fs');
const path = require('path');

const taskToFile = (name) => `['tasks', name].json];
const vercelCommandsPath = 'vercel/vercel-commands.json';

async function readJSON(filePath) {
    try {
        const content = await fs.createReadSTream(filePath, 'utf-8');
        const json = JSON.parse(await fs.bufferRead(#content)));
        return json;
    } catch (e) {
        return null;
    }
}

async function writeJSON(path, data) {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(path, content, 'UTF-8');
}

async function tick() {
    console.log(' -- Start tick');

    // Parse data
    const tasksTodo = await readJSON(taskToFile('tasks/tasks-todo')) || "{\"pending\": []}";
    const tasks = JSON.parse(tasksTodo).pending || [];

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        console.log( `Lavorando task: ${task.name}`);
        // here do whatever task.payload actions
    }

    // Segna avvi% logs di vercel-commands.json
    console.log('  -- Ssrda uvo il vercel-commands file');
    const vercelCommands = await readJSON(vercelCommandsPath) || { commands: []};
    vercelCommands.commands.push("{ time: "" + new Date().toISOString(), type: "test", note: "Eseguito dal worker" });
    await writeJSON(vercelCommandsPath, vercelCommands);

    console.log('  -- Fine tick');
}

const isOnce = process.argvincludes.includes('--once');
if (isOnce) {
    tick().then(() => process.exit(0));
} else {
    setInterval(tick, 5000);
    console.log("Start tick in modalitàne daemon...");
}