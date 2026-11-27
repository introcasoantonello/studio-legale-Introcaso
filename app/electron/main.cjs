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
      ...(payload?.webSearch ? {
        tools: [{
          type: "web_search",
          search_context_size: "high",
          ...(payload?.officialOnly ? { filters: { allowed_domains: [
            "normattiva.it", "gazzettaufficiale.it", "cortedicassazione.it",
            "cortecostituzionale.it", "giustizia-amministrativa.it",
            "giustizia.it", "eur-lex.europa.eu", "curia.europa.eu"
          ] } } : {})
        }],
        tool_choice: "required",
        include: ["web_search_call.action.sources"]
      } : {}),
      input: messages
    }),
    signal: AbortSignal.timeout(120000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || ("Errore API HTTP " + response.status);
    throw new Error(message.slice(0, 700));
  }
  const outputParts = (data.output || []).flatMap(item => item.content || [])
    .filter(part => part.type === "output_text");
  const text = outputParts.map(part => part.text).join("\n").trim();
  const citations = outputParts.flatMap(part => (part.annotations || [])
    .filter(a => a.type === "url_citation" && a.url)
    .map(a => ({ title: a.title || a.url, url: a.url })))
    .filter((item, index, all) => all.findIndex(x => x.url === item.url) === index);
  if (!text) throw new Error("La risposta API non contiene testo leggibile.");
  return { text, citations };
});


const { dialog } = require("electron");
const libraryConfigPath = () => path.join(app.getPath("userData"), "local-library.json");
async function getLibraryPath() {
  const data = await fs.readFile(libraryConfigPath(), "utf8").then(JSON.parse).catch(() => ({}));
  return typeof data.folder === "string" ? data.folder : null;
}
async function setLibraryPath(folder) {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(libraryConfigPath(), JSON.stringify({ folder }), { mode: 0o600 });
}
const supportedExtensions = new Set([".pdf", ".docx", ".txt", ".rtf"]);
const MAX_DOC_BYTES = 10 * 1024 * 1024;
async function walkDocuments(root, dir = root, found = []) {
  if (found.length >= 2000) return found;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (found.length >= 2000 || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      await walkDocuments(root, full, found);
    } else if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      const stat = await fs.stat(full);
      found.push({ name: entry.name, relativePath: path.relative(root, full), extension: path.extname(entry.name).toLowerCase(), size: stat.size, modified: stat.mtime.toISOString() });
    }
  }
  return found;
}
async function extractDocument(fullPath) {
  const ext = path.extname(fullPath).toLowerCase();
  const stat = await fs.stat(fullPath);
  if (!stat.isFile() || stat.size > MAX_DOC_BYTES) throw new Error("Documento troppo grande (limite 10 MB) o non valido.");
  const buffer = await fs.readFile(fullPath);
  if (ext === ".pdf") {
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }
  if (ext === ".docx") {
    const mammoth = require("mammoth");
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value || "";
  }
  if (ext === ".txt") return buffer.toString("utf8");
  if (ext === ".rtf") return buffer.toString("utf8").replace(/\\[a-zA-Z]+-?\d* ?/g, " ").replace(/[{}]/g, " ").replace(/\\'[0-9a-fA-F]{2}/g, " ").replace(/\s+/g, " ").trim();
  throw new Error("Formato non supportato. Sono ammessi PDF, DOCX, TXT e RTF.");
}
ipcMain.handle("library:get-folder", async () => ({ folder: await getLibraryPath() }));
ipcMain.handle("library:choose-folder", async () => {
  const result = await dialog.showOpenDialog({ title: "Seleziona la cartella ATTI", properties: ["openDirectory"] });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  await setLibraryPath(result.filePaths[0]);
  return { folder: result.filePaths[0] };
});
ipcMain.handle("library:scan", async () => {
  const root = await getLibraryPath();
  if (!root) throw new Error("Seleziona prima la cartella ATTI.");
  const stat = await fs.stat(root).catch(() => null);
  if (!stat?.isDirectory()) throw new Error("La cartella selezionata non è più disponibile. Selezionala nuovamente.");
  return { folder: root, files: await walkDocuments(root) };
});
ipcMain.handle("library:read-file", async (_event, relativePath) => {
  const root = await getLibraryPath();
  if (!root || typeof relativePath !== "string") throw new Error("Percorso del documento non valido.");
  const base = path.resolve(root);
  const full = path.resolve(base, relativePath);
  if (!full.startsWith(base + path.sep)) throw new Error("Percorso non autorizzato.");
  const text = await extractDocument(full);
  return { name: path.basename(full), text: text.slice(0, 45000), truncated: text.length > 45000 };
});
ipcMain.handle("library:search", async (_event, query) => {
  const root = await getLibraryPath();
  if (!root) throw new Error("Seleziona prima la cartella ATTI.");
  const term = typeof query === "string" ? query.trim().toLocaleLowerCase("it") : "";
  if (term.length < 2) throw new Error("Inserisci almeno due caratteri per la ricerca.");
  const files = await walkDocuments(root);
  const results = [];
  for (const file of files) {
    if (results.length >= 50) break;
    try {
      const content = await extractDocument(path.join(root, file.relativePath));
      const index = content.toLocaleLowerCase("it").indexOf(term);
      if (index >= 0) {
        const excerpt = content.slice(Math.max(0, index - 180), Math.min(content.length, index + term.length + 260)).replace(/\s+/g, " ").trim();
        results.push({ ...file, excerpt });
      }
    } catch (_) {}
  }
  return { results, scanned: files.length };
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
