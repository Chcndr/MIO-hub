// mio-worker.js - versione 0
// Simplice orchestratore per task: codegen con RouteLLM Abacus

// Requires node.fetch or axios
const fetch = require('node-fetch');
const fs = require('fs');

const ROUTE_LMM_KEY = '{{XYOUR_KEY_HERE}}';

// Funsione per task codegen chamata a RouteLLM Abacus
async function runTask(filePath) {
  const content = JSON.parse(fs.readSync(filePath, 'utf8'));
  const taskType = content.type;

  if (taskType === 'codegen') {
    const resp = await fetch('https://abacus.ai/app/route-llm-plus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ROUTE_LMM_KEY}`
      },
      body: JSON.stringify({
        task: content.task,
        mode: 'codegen'
      })
    });

    const output = await resp.json();
    const logPath = `/logs/deploy-${content.id}.txt`;
    fs.writeSync(logPath, output, 'utf8');

    console.log(`Codegen task ${filePath} completo e output salvato in log`);
  }
}

module.exports = runTask;