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

const { clipboard } = require("electron");
ipcMain.handle("clipboard:read", async () => clipboard.readText());

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
      instructions: "Sei l’assistente giuridico personale dello Studio Legale Introcaso e supporti un avvocato che esercita in Italia. Rispondi in italiano giuridico, con precisione, stile professionale e discorsivo. Per gli atti usa paragrafi articolati, evita grassetti ed elenchi nel corpo salvo necessità o richiesta. Rispetta rigorosamente modelli, carta intestata, formulazioni e istruzioni dell’avvocato; non modificare silenziosamente fatti, domande, eccezioni o conclusioni. Non inventare fatti, documenti, norme, sentenze, massime, numeri, date, importi, allegati o termini. Distingui fatti documentati, allegazioni di parte, contestazioni, inferenze e dati mancanti. Per il diritto vigente e la giurisprudenza attuale utilizza la ricerca solo quando attivata; privilegia fonti primarie e istituzionali. Per ogni precedente indica estremi e fonte solo se verificati; distingui testo integrale, massima e semplice riferimento; segnala contrasti e precedenti successivi. Non dichiarare di aver consultato Italgiure, DeJure o banche dati non effettivamente accessibili. Per i termini processuali esplicita dies a quo, regola di computo e sospensioni; se mancano dati, non indicare una scadenza certa. Collega ogni richiesta istruttoria a fatti specifici e non proporre quesiti esplorativi. Evidenzia eccezioni, oneri probatori, preclusioni, criticità e verifiche mancanti. Non dichiarare mai un atto pronto per il deposito: ogni elaborato richiede controllo e approvazione dell’avvocato. Non inviare, depositare o notificare atti.",
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
    const extracted = (parsed.text || "").trim();
    if (extracted.length >= Math.max(80, (parsed.numpages || 1) * 100)) return extracted;
    return await ocrPdf(buffer);
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
async function ocrPdf(buffer) {
  let worker;
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createCanvas } = require("@napi-rs/canvas");
    const { createWorker } = require("tesseract.js");
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true, useSystemFonts: true }).promise;
    if (pdf.numPages > 30) throw new Error("OCR limitato a 30 pagine per documento.");
    worker = await createWorker("ita");
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const viewport = page.getViewport({ scale: 1.65 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      const result = await worker.recognize(canvas.toBuffer("image/png"));
      pages.push("\n[Pagina " + pageNo + "]\n" + (result.data.text || ""));
    }
    return pages.join("\n").trim();
  } catch (error) {
    throw new Error("OCR del PDF non riuscito: " + (error?.message || String(error)));
  } finally {
    if (worker) await worker.terminate().catch(() => {});
  }
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


let italgiureWindow = null;
let bdpWindow = null;
function openLegalDatabaseWindow(which) {
  const isBdp = which === "bdp";
  const current = isBdp ? bdpWindow : italgiureWindow;
  if (current && !current.isDestroyed()) { current.focus(); return Promise.resolve({ opened: true }); }
  const { session } = require("electron");
  const partition = isBdp ? "persist:studio-introcaso-bdp" : "persist:studio-introcaso-italgiure";
  const win = new BrowserWindow({
    width: 1440, height: 950, minWidth: 980, minHeight: 700,
    title: isBdp ? "Banca Dati di Merito — Studio Legale Introcaso" : "Italgiure — Studio Legale Introcaso",
    backgroundColor: "#ffffff",
    webPreferences: { session: session.fromPartition(partition), nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  if (isBdp) bdpWindow = win; else italgiureWindow = win;
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.on("closed", () => { if (isBdp) bdpWindow = null; else italgiureWindow = null; });
  const url = isBdp ? "https://bdp.giustizia.it/search/standard?target=provvedimento&sort_field=data&sort_order=desc" : "https://www.italgiure.giustizia.it/";
  return win.loadURL(url).then(() => ({ opened: true }));
}
ipcMain.handle("bdp:open", async () => openLegalDatabaseWindow("bdp"));
ipcMain.handle("italgiure:open", async () => openLegalDatabaseWindow("italgiure"));

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
