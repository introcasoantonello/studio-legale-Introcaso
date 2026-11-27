# Studio Legale Introcaso — applicazione Windows

## Installazione
Il workflow GitHub Actions compila automaticamente l'installer Windows. Aprire la scheda Actions del repository, selezionare l'esecuzione completata e scaricare l'artefatto **Studio-Legale-Introcaso-Windows-Installer**. Estrarre lo ZIP e avviare il file Setup `.exe`.

## Moduli
Fascicoli, bozze atti, assistente GPT integrato, ricerca giuridica, scadenziario, calcoli aritmetici e archivio modelli.

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
