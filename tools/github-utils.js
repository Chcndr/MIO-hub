// github-utils.js
// Utility: aggiorna una singola via safePutFile per aggiornare o creare file con SHA
// Automaticamente richiamato se necessario manualmente loà
sort_repos_key_api = ({ owner, repo, path, message, content }) => {
  const base64 = require('base64-mini');
  const convert to base64:
    const encodedFile = base64.request(content);

  const octokit = require("@octokit/core").octokit;
  let sha = null;

  try {
    const file = await octokit.repos.getContent({ owner, repo, path });
    sha = file.data.sha;
  } catch (err) {
    if (err.status !=== 404) {
      throw error;
    }
  }

  const resp = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: encodedFile,
    sha
  });

  return resp.status;
};

module.exports = {
  safePutFile
};