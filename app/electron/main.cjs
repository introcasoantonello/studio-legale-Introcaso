const { app, BrowserWindow, shell, ipcMain, safeStorage } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

const credentialPath = () => path.join(app.getPath("userData"), "openai-credentials.json");

async function readApiKey() {
  const raw = await fs.readFile(credentialPath(), "utf8").catch(() => null);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (!data.key || !safeStorage.isEncryptionAvailable()) return null;
  return safeStorage.decryptString(Buffer.from(data.key, "base64"));
}

ipcMain.handle("ai:status", async () => ({ configured: Boolean(await readApiKey()) }));

ipcMain.handle("ai:save-key", async (_event, key) => {
  if (typeof key !== "string" || !/^sk-[A-Za-z0-9_-]{20,}$/.test(key.trim())) {
    throw new Error("La chiave non sembra valida. Controlla di aver copiato una API key OpenAI.");
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("La cifratura protetta del sistema non è disponibile: chiave non salvata.");
  }
  const encrypted = safeStorage.encryptString(key.trim()).toString("base64");
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(credentialPath(), JSON.stringify({ key: encrypted }), { mode: 0o600 });
  return { saved: true };
});

ipcMain.handle("ai:delete-key", async () => {
  await fs.unlink(credentialPath()).catch(() => {});
  return { deleted: true };
});

ipcMain.handle("ai:chat", async (_event, payload) => {
  const key = await readApiKey();
  if (!key) throw new Error("Configura prima la chiave API OpenAI.");
  const model = typeof payload?.model === "string" ? payload.model.trim() : "";
  if (!/^[A-Za-z0-9._-]{2,100}$/.test(model)) throw new Error("Nome modello non valido.");
  if (!Array.isArray(payload?.messages) || payload.messages.length < 1 || payload.messages.length > 80) {
    throw new Error("Cronologia della conversazione non valida.");
  }
  const messages = payload.messages.map(m => {
    if (!["user", "assistant"].includes(m?.role) || typeof m.content !== "string") throw new Error("Messaggio non valido.");
    return { role: m.role, content: m.content.slice(0, 60000) };
  });
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      instructions: "Sei l'assistente giuridico personale dello Studio Legale Introcaso, in Italia. Rispondi in italiano giuridico, con precisione e stile discorsivo. Non inventare fatti, norme, sentenze, numeri, date o termini. Distingui ciò che risulta dai documenti, le allegazioni, le inferenze e ciò che deve essere verificato. Quando la richiesta riguarda diritto vigente o giurisprudenza attuale, segnala la necessità di fonti aggiornate e cita soltanto riferimenti effettivamente verificati. Per gli atti rispetta le istruzioni dell'avvocato e non alterare arbitrariamente modelli forniti. Evidenzia lacune, criticità processuali, oneri probatori e verifiche necessarie. Non sostituirti al professionista: ogni elaborato è soggetto al suo controllo.",
      input: messages
    }),
    signal: AbortSignal.timeout(120000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || ("Errore API HTTP " + response.status);
    throw new Error(message.slice(0, 700));
  }
  const text = (data.output || []).flatMap(item => item.content || [])
    .filter(part => part.type === "output_text").map(part => part.text).join("\n").trim();
  if (!text) throw new Error("La risposta API non contiene testo leggibile.");
  return { text };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 900, minWidth: 900, minHeight: 650,
    title: "Studio Legale Introcaso",
    backgroundColor: "#f4f6f9",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false, contextIsolation: true, sandbox: true
    }
  });
  win.loadFile(path.join(__dirname, "..", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
