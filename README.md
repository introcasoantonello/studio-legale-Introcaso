# Studio Legale Introcaso — sistema di assistenza giuridica

Repository di skill operative e linee guida per supportare le attività dello Studio Legale Introcaso. Le skill sono istruzioni specializzate: non sono software autonomo, non costituiscono una banca dati e non si attivano automaticamente in ChatGPT per il solo fatto di essere presenti su GitHub.

## Moduli disponibili

### Coordinamento e ricerca
- [Assistente giuridico italiano](skills/assistente-giuridico-italiano/SKILL.md) — modulo di ingresso: coordina le skill, definisce il metodo di ricerca normativa e giurisprudenziale e disciplina l'uso controllato di Firecrawl.
- [Diritto italiano](skills/diritto-italiano/SKILL.md) — metodo generale, fonti normative, analisi documentale e affidabilità.
- [Ricerca giurisprudenziale avanzata](skills/ricerca-giurisprudenziale/SKILL.md) — ricerca e verifica di Cassazione, Corte costituzionale, giudici di merito e orientamenti.
- [Analisi dei fascicoli](skills/analisi-fascicoli/SKILL.md) — inventario documenti, cronologia, matrice fatti/prove, incongruenze e lacune.

### Redazione e contenzioso
- [Redazione atti civili](skills/redazione-atti-civili/SKILL.md) — atti di cognizione, monitori, esecuzioni, opposizioni, famiglia, responsabilità civile e impugnazioni.
- [Diritto amministrativo e TAR](skills/diritto-amministrativo-tar/SKILL.md) — ricorsi, motivi aggiunti, cautelari, accesso, silenzio e ottemperanza.
- [Contratti e consulenza stragiudiziale](skills/contratti-consulenza-stragiudiziale/SKILL.md) — contratti, transazioni, diffide, messe in mora e pareri.

### Organizzazione e verifica
- [Scadenziario processuale](skills/scadenziario-processuale/SKILL.md) — calcolo documentato dei termini e promemoria.
- [Compensi e spese](skills/calcolo-compensi-spese/SKILL.md) — parcelle, parametri, accessori, interessi, precetti e residui.
- [Archivio modelli dello Studio](skills/archivio-modelli-studio/SKILL.md) — classificazione, riuso controllato, anonimizzazione e versionamento.
- [Controllo qualità degli atti](skills/controllo-qualita-atti/SKILL.md) — controllo fattuale, giuridico, processuale e redazionale.

## Integrazione con la ricerca web

Il modulo Assistente giuridico italiano può utilizzare Firecrawl quando il relativo connettore è effettivamente collegato a ChatGPT, per cercare e acquisire contenuti di pagine pubbliche. Firecrawl è uno strumento di ricerca web, non una banca dati giuridica ufficiale e non garantisce copertura completa. Le fonti primarie istituzionali restano prioritarie; l'accesso a Italgiure, DeJure o altri servizi riservati non è implicato dal collegamento Firecrawl.

## Applicazione web locale

È disponibile una prima applicazione utilizzabile dal browser, senza installazione: [apri la cartella dell'app](app/) e consulta le [istruzioni di avvio](app/README.md). Include fascicoli, bozze di atti, traccia per la ricerca giuridica, scadenziario, calcoli aritmetici e archivio modelli. I dati restano nel browser del dispositivo. Questa versione non integra ancora AI, banche dati giuridiche o deposito telematico.

## Applicazione Windows e Assistente AI

La cartella [app](app/) contiene l'applicazione dello Studio. È configurata la compilazione automatica dell'installer Windows tramite GitHub Actions: consultare [le istruzioni](app/README.md) per scaricare il file Setup dopo il completamento del workflow. Il modulo Assistente AI personale prepara richieste giuridiche sul PC, senza API, chiavi o fatturazione API. L'utente controlla il testo, lo copia e lo invia manualmente tramite il proprio account ChatGPT. Non è un modello AI offline e non trasmette automaticamente fascicoli. La prima versione desktop non è ancora firmata digitalmente.

## Modelli
- [Linee guida per l'archivio dei modelli](templates/README.md).

## Flusso di lavoro consigliato

1. Acquisire i documenti e inventariare il fascicolo.
2. Ricostruire fatti, cronologia, domande, prove e questioni.
3. Verificare normativa e giurisprudenza sulle fonti effettivamente accessibili.
4. Definire strategia e rito, controllando termini e preclusioni.
5. Redigere utilizzando, se disponibile, il modello approvato più pertinente.
6. Eseguire il controllo qualità e sottoporre la bozza all'avvocato.
7. Conservare modelli e materiali soltanto dopo anonimizzazione e verifica delle autorizzazioni.

## Regole inderogabili

- Non inventare fatti, documenti, norme, precedenti, numeri, date, importi o termini.
- Dichiarare quali fonti sono state realmente consultate e quali verifiche restano da fare.
- Non dichiarare accesso a Italgiure o DeJure se non è avvenuto concretamente.
- Proteggere segreto professionale e dati personali; non caricare fascicoli identificabili in repository pubblici o servizi esterni.
- Nessun deposito, notifica, invio o assunzione di impegni senza approvazione dell'avvocato.

## Nota sull'attivazione

La presenza dei file su GitHub non equivale all'installazione o all'attivazione automatica delle skill in ChatGPT. Per utilizzarle in un ambiente compatibile occorre importare o richiamare i relativi file secondo le funzioni supportate da quell'ambiente. Il connettore Firecrawl, se collegato, è una risorsa distinta dalle skill conservate nel repository.

## Utilizzo con ChatGPT

- [Guida completa all'utilizzo](ISTRUZIONI-UTILIZZO-CHATGPT.md) — come richiamare le skill, scegliere i moduli e lavorare sui fascicoli.
- [Prompt rapido da copiare](PROMPT-AVVIO-CHATGPT.md) — istruzioni da incollare all'inizio di un nuovo incarico.
