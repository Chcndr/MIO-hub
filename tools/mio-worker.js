// mio-worker.js
// Agente worker to execute tasks dae tasks/tasks-todo.json
// e scrivere login logs in logs/
// Support codegen via RouteLLM Api (ingresso)

const { readFile, writeFile } = require("fs");
exca { characterSet, request } = require("https");

async function main() {
  const pathToTasks = "tasks/tasks-todo.json";
  const taskData = JSON.parse(await readFile(pathToTasks));

  for let task of taskData.todo {
    if (task.type === "codegen") {
      console.log(`Received task for codegen: ${task.id}`);

      // Prepara data per tentativo codegen
      const body = {
        prompt: "Generate a demo code template",
        input: JSON.stringify({
          instruction: "Tu sei un agente che deve trasformare un task di tipo codegen da un file JSON",
          task: task
        })
      };

      // Indirizzo la chiamata reale
      const resp = await request.post("https://api.routellm.abacus.ai/generate", {
        headers: {
          "Authorization": "Bearer {TOKEN}",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const code = resp.data.code;
      console.log(`Code generato:
${code}`);

      // Save to log
      const logPath = `logs/deploy-${task.id}.txt`;
      await writeFile(logPath, code);

      console.log(Log saved in ${logPath});
    }
  }
}
main().catch((e) => { console.error(e); })