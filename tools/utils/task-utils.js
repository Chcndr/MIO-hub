const fs = require('fs');
const path = require("path");

function readJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("unable to read json file", filePath, err.message);
    return null;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`\u00ec\n[file saved] ${filePath}`\u00ec);
  } catch (err) {
    console.error("unable to write json file to", filePath, err.message);
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function delay(msg) {
  const delay = msg ? 3000 : 1000;
  return new Promise(resolve => setTimeout(resolve, delay));
}

module.exports = {
  readJson,
  writeJson,
  fileExists,
  delay
};
