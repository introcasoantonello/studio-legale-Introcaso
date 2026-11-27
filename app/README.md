# Studio Legale Introcaso — applicazione

## Installazione Windows
Il repository compila automaticamente un programma Windows tramite GitHub Actions. Dopo l'esecuzione del workflow **Build Windows desktop app**, aprire la scheda Actions del repository, selezionare l'esecuzione completata e scaricare l'artefatto **Studio-Legale-Introcaso-Windows-Installer**. Estrarre lo ZIP e avviare il file Setup `.exe`.

Il programma è confezionato con Electron e utilizza i file locali dell'applicazione. Non è ancora firmato digitalmente: Windows SmartScreen potrebbe mostrare un avviso.

## Moduli
Fascicoli; redazione e salvataggio bozze; Assistente AI personale senza API; ricerca giuridica; scadenziario manuale; calcoli aritmetici; archivio modelli.

## AI e banche dati
L'assistente personale non usa API OpenAI, non richiede chiavi API e non comporta fatturazione API. Genera una richiesta sul computer, permette di controllarla, la copia negli appunti e apre ChatGPT nel browser. L'utente deve incollarla e inviarla manualmente con il proprio account ChatGPT. Non esiste un collegamento automatico alla sessione ChatGPT, né un modello AI installato localmente: la generazione delle risposte richiede la connessione a ChatGPT. Il programma non accede automaticamente a Italgiure, DeJure o altre banche dati riservate.

## Dati e riservatezza
I dati dell'app sono conservati nel profilo locale tramite localStorage e non sono sincronizzati né cifrati da questa applicazione. Soltanto il testo che l'utente sceglie di copiare e inviare a ChatGPT viene trasmesso al servizio online. Effettuare backup sicuri e non usare dispositivi condivisi per dati riservati. Non inserire fascicoli identificabili in servizi esterni senza aver valutato base giuridica, istruzioni, misure di sicurezza e segreto professionale.

## Limiti professionali
Non effettua depositi o notifiche, non determina autonomamente termini processuali e non sostituisce la verifica dell'avvocato. Tutte le bozze, fonti, scadenze e somme devono essere controllate.
