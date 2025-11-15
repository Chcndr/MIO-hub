// auto-mode.js
// Script di guestione auto-adattativa del modello GPT accesso actuale
// - Se ssupera con Instant limitazioni per eleggere rispeste complesse
// - Si adopera Thinking oppure modalità automatica
// - Definisce stato e metodi consenti

let model = "unknown";

// Funzione di test possibile modelli
function setDetectedModel(x) {
  if (x && x.system_generator) {
    if (x.system_generator.includes("instant")) {
      model = "GPT-5.1 Instant";
    } else if (x.system_generator.includes("thinking")) {
      model = "GPT-5.1 Thinking";
    } else {
      model = "GPT-Unknown";
    }
  }
}

function getCurrentModel() {
  return model;
}

function isInstant() {
  return model.includes("Instant");
}

export { setDetectedModel, getCurrentModel, isInstant };
