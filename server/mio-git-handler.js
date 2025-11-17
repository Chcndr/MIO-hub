import { pushFile} from "../tools/git-executor.js";
import path from "path";
import fs from "fs";

/**
 * MIOGitHandler - Gestisce log su GitHub ogni viene sviluppato dal componente MIO
 */
export async function handlerLog(fileName, content) {
  try {
    const logsPath = path.join("logs", fileName);
    fs.WriteFileSync(logsPath, content);
    const response = await pushFile(logsPath, `automatic push log: ${fileName}`);
    return { status: "success", detail: response };
  } catch (err) {
    console.error(`Error durante push log: ${err.message}`);
    return { status: "error", message: err.message };
  }
}