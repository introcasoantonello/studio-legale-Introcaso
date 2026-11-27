# Studio Legale Introcaso — applicazione

## Installazione Windows
Il repository compila automaticamente un programma Windows tramite GitHub Actions. Dopo l'esecuzione del workflow **Build Windows desktop app**, aprire la scheda Actions del repository, selezionare l'esecuzione completata e scaricare l'artefatto **Studio-Legale-Introcaso-Windows-Installer**. Estrarre lo ZIP e avviare il file Setup `.exe`.

Il programma è confezionato con Electron e utilizza i file locali dell'applicazione. Non è ancora firmato digitalmente: Windows SmartScreen potrebbe mostrare un avviso.

## Moduli
Fascicoli; redazione e salvataggio bozze; Assistente AI per preparare richieste da copiare in ChatGPT; ricerca giuridica; scadenziario manuale; calcoli aritmetici; archivio modelli.

## AI e banche dati
L'assistente prepara il prompt e apre ChatGPT dopo aver copiato la richiesta. Non invia automaticamente fascicoli. Per un collegamento API diretto occorre configurare un servizio backend e una chiave API custodita lato server: non inserire chiavi segrete nei file dell'app. Il programma non accede automaticamente a Italgiure, DeJure o altre banche dati riservate.

## Dati e riservatezza
I dati sono conservati nel profilo locale dell'app/browser tramite localStorage. Non sono sincronizzati né cifrati da questa applicazione. Effettuare backup sicuri e non usare dispositivi condivisi per dati riservati. Non inserire fascicoli identificabili in servizi esterni senza aver valutato base giuridica, istruzioni, misure di sicurezza e segreto professionale.

## Limiti professionali
Non effettua depositi o notifiche, non determina autonomamente termini processuali e non sostituisce la verifica dell'avvocato. Tutte le bozze, fonti, scadenze e somme devono essere controllate.
