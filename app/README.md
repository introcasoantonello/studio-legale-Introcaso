# Studio Legale Introcaso — applicazione Windows

## Installazione
Il workflow GitHub Actions compila automaticamente l'installer Windows. Aprire la scheda Actions del repository, selezionare l'esecuzione completata e scaricare l'artefatto **Studio-Legale-Introcaso-Windows-Installer**. Estrarre lo ZIP e avviare il file Setup `.exe`.

## Moduli
Fascicoli, redazione assistita, assistente GPT integrato, ricerca giuridica online con fonti, scadenziario, calcoli aritmetici, archivio modelli e collegamento alla cartella ATTI locale.

### Redazione assistita multidisciplinare
La sezione **Redazione atti** comprende percorsi guidati per diritto civile e processo civile; diritto penale e procedura penale; processo penale minorile; diritto amministrativo e processo davanti al TAR; famiglia e tutela dei minori; lavoro e previdenza; esecuzione civile e recupero crediti; esecuzione penale e sorveglianza; responsabilità civile e infortunistica; societario e contratti. Tra le tipologie selezionabili sono inclusi denuncia-querela, opposizione all'archiviazione ex art. 410 c.p.p., memoria difensiva, atti cautelari e di riesame, impugnazioni penali, atti per esecuzione e sorveglianza, oltre agli atti civili e amministrativi. Il percorso genera una richiesta strutturata per l'assistente GPT usando esclusivamente i fatti e le istruzioni inseriti dall'utente. L'atto prodotto richiede sempre controllo professionale e verifica delle fonti e dei termini.

## Assistente GPT e configurazione API
1. Creare una API key nel proprio progetto OpenAI Platform.
2. Aprire **Assistente AI** nell'applicazione.
3. Incollare la chiave nel campo dedicato e premere **Salva chiave in modo cifrato**.
4. Verificare il nome del modello disponibile nel proprio progetto API; il campo modello è modificabile.
5. Scrivere la richiesta e premere **Invia a GPT**.

La chiave è cifrata tramite Electron `safeStorage` e Windows DPAPI e viene conservata nel profilo utente dell'app, non nel repository e non nel renderer. La chiave non viene restituita all'interfaccia. È possibile rimuoverla dal pulsante dedicato. Se la protezione del sistema non è disponibile, il programma rifiuta di salvarla in chiaro.

L'applicazione invia le richieste all'endpoint OpenAI Responses API con `store:false`. Le conversazioni sono conservate in memoria nella finestra corrente e non vengono salvate automaticamente in localStorage. La trasmissione al servizio OpenAI è necessaria per ricevere risposte: non è un modello offline.

## Costi e account
La fatturazione API è separata dall'abbonamento ChatGPT. L'uso dipende dal modello selezionato, dai token e dalle condizioni del progetto API. Verificare prezzi, limiti e disponibilità del modello nella piattaforma OpenAI prima dell'uso.

## Dati, riservatezza e sicurezza
I dati dei fascicoli, delle bozze e dello scadenzario già gestiti dall'applicazione sono conservati nel profilo locale del browser Electron. In questa versione non sono cifrati. La chiave API è invece cifrata dal sistema operativo. I messaggi inviati all'API vengono trasmessi a OpenAI; `store:false` richiede di non conservare la risposta come oggetto API, ma non equivale a una garanzia generale di zero retention per ogni trattamento. Valutare sempre le impostazioni del progetto e i termini applicabili.

Non inviare dati identificativi, sanitari o coperti da segreto professionale senza aver valutato necessità, anonimizzazione, base giuridica e misure di sicurezza. Predisporre backup protetti. Non inserire mai chiavi API nel codice o su GitHub.

## Limiti professionali
I collegamenti HTTPS alle fonti istituzionali e a ChatGPT si aprono nel browser esterno. Il modulo non deposita atti, non effettua notifiche e non sostituisce la verifica professionale. Normativa, giurisprudenza, termini e bozze devono essere controllati dall'avvocato.


## Cartella locale ATTI
Dal menu **Cartella ATTI** selezionare una cartella sul PC. Il percorso viene memorizzato localmente nel profilo dell'app. La scansione include PDF, DOCX, TXT e RTF (massimo 2.000 file; massimo 10 MB per documento). È possibile cercare parole nel testo dei documenti e aggiungere manualmente un documento alla chat GPT. Il contenuto viene trasmesso a OpenAI soltanto quando si invia la conversazione, non durante la scansione. I file DOC legacy, le scansioni senza testo OCR e i PDF protetti da password non sono leggibili in questa versione. I documenti restano nella cartella originale e non vengono copiati nel repository.


## Ricerca giuridica online (versione 1.3.0)
Il modulo Ricerca giuridica può inviare quesiti al web search integrato nella OpenAI Responses API. È possibile limitare la ricerca a domini istituzionali (Normattiva, Gazzetta Ufficiale, Cassazione, Corte costituzionale, Giustizia amministrativa, EUR-Lex e CURIA) oppure utilizzare una ricerca web ampia. Le citazioni URL restituite dall'API sono mostrate come collegamenti cliccabili nella chat. La ricerca è subordinata alla disponibilità del modello, della chiave API e della fatturazione API. Il filtro istituzionale limita i domini, ma non garantisce copertura esaustiva né sostituisce banche dati professionali o la lettura del provvedimento integrale.


## Carta intestata e analisi fascicolo (1.4.1)
Le risposte dell'assistente possono essere esportate in formato Word compatibile (.doc) con intestazione conforme al modello ODT fornito dallo Studio: AVVOCATO, ANTONELLO INTROCASO, Patrocinante in Cassazione e riga separatrice; il piè di pagina riproduce la linea del modello. Il formato è modificabile in Word/LibreOffice e va controllato prima del deposito. Nella Cartella ATTI è disponibile la selezione di 2-4 documenti per analisi comparativa tramite assistente AI; i documenti vengono letti localmente e trasmessi all'API soltanto quando viene avviata l'analisi.


## Collegamento a Italgiure (1.4.2)
La sezione **Italgiure** apre la piattaforma ufficiale del Ministero della Giustizia e il sito di Cassa Forense. L'autenticazione avviene direttamente sul portale, con le credenziali personali abilitate; l'applicazione non raccoglie né conserva username o password e non automatizza l'accesso, le ricerche o i download. Per analizzare un provvedimento, scaricarlo dal portale in PDF o DOCX e salvarlo nella cartella locale collegata in **Cartella ATTI**. Da lì è possibile leggerlo, confrontarlo con altri documenti o aggiungerlo manualmente alla chat. I documenti vengono trasmessi all'API OpenAI soltanto quando l'utente avvia esplicitamente l'analisi.
