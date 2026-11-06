# MBI - specifiche del sito, versione 0.2 (novembre 2026)

## Struttura

- Home (`index.html`): cosa fa il progetto, chi lo fa. Nessun riferimento esterno e
  nessun link al questionario.
- Due pagine di ingresso, stesso questionario e stesso codice: `studenti.html` e
  `colleghi.html`. Cambiano solo il testo, il premio e la data di chiusura. Il
  gruppo passa al questionario con il parametro `?g=`.
- Questionario (`survey.html`), una sola pagina: consenso e informativa, 38
  confronti, domande finali, fine con email e possibilita' di ricominciare.

## Questionario

- Sezioni e confronti: telegiornali 5, approfondimento 12, giornali e siti 13,
  mista 8. Totale 38, circa sei minuti.
- Outlet: 10 TG, 26 approfondimenti, 25 testate web; 13 ancore per la sezione
  mista (colonna `mixed`).
- Domanda: "Quale dei due e' piu' orientato a sinistra?" oppure "...a destra?",
  estratta a caso per ogni questionario e uguale per tutto il questionario.
- Risposte: uno dei due outlet, "Sono sulla stessa posizione", "Non li conosco
  abbastanza".
- Coppie: permutazioni casuali, ogni outlet compare una volta prima che un altro
  compaia due volte; nessuna coppia ripetuta nello stesso questionario; posizione
  a schermo casuale; nella sezione mista coppie sempre fra tipi diversi.
- Scelta con un clic o da tastiera, avanzamento automatico, "Indietro" sempre
  disponibile.
- Domande finali facoltative: sicurezza complessiva (1-5), frequenza con cui si
  seguono telegiornali, approfondimento e siti di informazione.
- Ripresa: un questionario interrotto nella stessa scheda riprende da dove era.
- Questionari ripetuti: alla fine "Compila un altro questionario" ne apre uno
  nuovo con coppie nuove.

## Dati

- Form "MBI Risposte": una riga per confronto, piu' una riga finale.
- Form "MBI Estrazione": email, gruppo, interview_id.
- Dettagli e regole di lettura dei dati: `GOOGLE_FORMS_SETUP.md`.

## Vincoli

- HTML, CSS e JavaScript senza librerie esterne, nessun font esterno.
- Testi rivolti al pubblico solo in italiano.
- Funziona anche se il browser blocca lo storage locale.
