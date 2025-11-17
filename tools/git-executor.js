import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Git Executor - Gestione commit/push diretti da MIO
 * -------------------------------------------------------------
 * Usa comandi Git nativi per evitare errori api Base64.
 * Si integra con backend Node.js (server MIO or script)
 */

const REPO_PATH = path.resolve(process.env.MIO_REPO_PATH|| "../");
const AUTHOR = process.env.GIT_AUTHOR|| "MIO Agent <mio@dms.dev>";
const BRANCH = process.env.MIO_BRANCH|| "master";

export async function pushFile(filePath, commitMsg) {
  try {
    // Verifica file
    const fullPath = path.join(REPO_PATH, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File non trovato: ${fullPath}`);
    }

    // Imposta autore commit
    execSync(`git config user.name "MIO Agent"`);
    execSync(`git config user.email "mio@dms.dev"`);

    // Stage, commit e push
    execSync(`git add "$filePath"`, { cwd: REPO_PATH });
    execSync(`git commit -m "$commitMsg" --author "$AUTHOR"`, { cwd: REPO_PATH });
    execSync(`git push origin ${BRANCH}`, { cwd: REPO_PATH });

    console.log(`*✔✔  Push completato: ${filePath}`);
    return { status: "success", message: `File pushato: ${filePath}` };
  } catch (err) {
    console.error(`*✔✔  Errore push: ${err.message}`);
    return { status: "error", message: err.message };
  }
}

/**
 * Esegue commit multipli per batch di file
 */
export async function pushBatch(files = []) {
  for (const { file, message } of files) {
    await pushFile(file, message);
  }
}
