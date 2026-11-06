# Collegare MBI ai Google Form

Il sito invia i dati a **due** Google Form, tenuti separati di proposito:

| Form | Cosa raccoglie | Righe |
|---|---|---|
| **MBI Risposte** | i confronti a coppie e le domande finali | una per confronto, piu' una finale per questionario |
| **MBI Estrazione** | le email per l'estrazione | una per ogni questionario completo con email |

I due form hanno in comune solo `interview_id`. Serve a contare quante
partecipazioni ha ogni email, ma le email non stanno nello stesso foglio delle
risposte (e' quello che dice l'informativa del sito).

Finche' i codici non sono configurati il sito funziona lo stesso: non invia
niente e scrive nella console del browser (F12, scheda Console) le righe che
avrebbe inviato, con il prefisso `[MBI, form non configurato]`. E' il modo piu'
comodo per provarlo.

Tempo necessario: circa 20 minuti.

---

## Passo 1. Crea il form "MBI Risposte"

1. Vai su [forms.google.com](https://forms.google.com) e crea un modulo vuoto.
2. Titolo: `MBI Risposte` (i rispondenti non lo vedono mai).
3. Aggiungi **14 domande**, tutte di tipo **Risposta breve**, con questi titoli e
   in quest'ordine:

| # | Titolo della domanda | Contenuto |
|---|---|---|
| 1 | `respondent_id` | codice del browser: uguale per tutti i questionari fatti dallo stesso browser |
| 2 | `interview_id` | codice del singolo questionario |
| 3 | `gruppo` | `studenti`, `colleghi`, oppure `altro` se il link non aveva il gruppo |
| 4 | `direzione` | `sinistra` o `destra`: come era formulata la domanda in quel questionario |
| 5 | `sezione` | `tg`, `talk`, `press`, `mixed`, oppure `fine` nella riga finale |
| 6 | `confronto` | es. `talk-3`; `fine` nella riga finale |
| 7 | `outlet_a` | codename dell'outlet mostrato a sinistra sullo schermo |
| 8 | `outlet_b` | codename dell'outlet mostrato a destra sullo schermo |
| 9 | `risposta` | codename scelto, oppure `uguali`, `nonso`; `completato` nella riga finale |
| 10 | `sicurezza` | 1-5, solo nella riga finale |
| 11 | `freq_tg` | solo nella riga finale |
| 12 | `freq_talk` | solo nella riga finale |
| 13 | `freq_web` | solo nella riga finale |
| 14 | `timestamp` | data e ora dell'invio |

4. **Nessuna domanda obbligatoria.**

## Passo 2. Crea il form "MBI Estrazione"

Stessa procedura, titolo `MBI Estrazione`, **4 domande** di tipo Risposta breve:

| # | Titolo della domanda |
|---|---|
| 1 | `email` |
| 2 | `gruppo` |
| 3 | `interview_id` |
| 4 | `timestamp` |

## Passo 3. Impostazioni di entrambi i form

Nell'ingranaggio **Impostazioni**:

- **Risposte, Raccogli indirizzi email**: *Non raccogliere* (l'email la mandiamo noi).
- **Risposte, Limita a 1 risposta**: disattivato. Se e' attivo Google chiede il
  login e il sito non riesce a scrivere.
- **Presentazione**: il messaggio di conferma non conta, nessuno lo vede.

Se l'account e' di un'organizzazione (per esempio UniTo), controlla che il form
**non sia limitato agli utenti dell'organizzazione**: in quel caso gli invii da
fuori vengono rifiutati senza errori visibili.

## Passo 4. Recupera gli identificativi

Per ciascun form servono l'**ID del form** e gli **entry ID** di ogni domanda.

1. Apri il form in modifica, menu con i tre puntini, **Ottieni link precompilato**.
2. Compila ogni campo con il suo stesso nome (nel campo `email` scrivi `email`,
   in `gruppo` scrivi `gruppo`, e cosi' via): ti serve per riconoscerli.
3. **Ottieni link**, poi **Copia link**. Il link e' fatto cosi':

```
https://docs.google.com/forms/d/e/1FAIpQLSc...ABC.../viewform?usp=pp_url&entry.123456789=respondent_id&entry.987654321=interview_id&...
```

4. La parte fra `/d/e/` e `/viewform` e' l'**ID del form**.
5. Ogni `entry.NNNNNNNNN=nome` ti dice l'entry ID di quel campo.

## Passo 5. Inserisci i codici in `assets/script.js`

In cima al file c'e' il blocco `CONFIG`. Sostituisci:

- `ID_FORM_RISPOSTE` nell'indirizzo `RISPOSTE_URL` con l'ID del form "MBI Risposte";
- ogni `entry.XXXX..` nel blocco `RISPOSTE` con l'entry ID del campo con lo stesso nome;
- `ID_FORM_EMAIL` in `EMAIL_URL` con l'ID del form "MBI Estrazione";
- ogni `entry.YYYY..` nel blocco `EMAIL`.

L'indirizzo deve finire con `/formResponse` (non `/viewform`). Esempio:

```javascript
RISPOSTE_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSc...ABC.../formResponse',
RISPOSTE: {
  respondent_id: 'entry.123456789',
  interview_id:  'entry.987654321',
  ...
```

Il sito considera configurato un form solo quando nell'indirizzo non c'e' piu'
`ID_FORM` e negli entry non c'e' piu' `XXXX` o `YYYY`: se ne dimentichi uno,
quel form non riceve niente.

## Passo 6. Collega i fogli di calcolo

In ciascun form, scheda **Risposte**, icona verde di Google Sheets, **Crea un
nuovo foglio**. Da qui in poi ogni invio compare come riga del foglio.

## Passo 7. Prova

1. Pubblica il sito su GitHub Pages (commit e push del repository) oppure
   provalo in locale:
   ```bash
   cd mediabiasitaly.github.io
   python3 -m http.server 8000
   ```
   e apri `http://localhost:8000/studenti.html`.
2. Completa un questionario e lascia un'email di prova.
3. Nel foglio "MBI Risposte" devono comparire **39 righe** (38 confronti e la
   riga `fine`); nel foglio "MBI Estrazione" **una riga**.
4. Cancella le righe di prova dai due fogli prima del lancio.

Se non compare niente: ricontrolla che gli indirizzi finiscano con
`/formResponse`, che gli entry ID siano giusti e che il form accetti risposte
senza login. Il browser non mostra errori, perche' Google Forms risponde in
modalita' `no-cors`.

---

## I link da distribuire

| Chi | Link |
|---|---|
| Studenti | `https://mediabiasitaly.github.io/studenti.html` |
| Colleghi | `https://mediabiasitaly.github.io/colleghi.html` |
| Home (nessun link al questionario) | `https://mediabiasitaly.github.io/` |

Le due pagine portano a `survey.html?g=studenti` e `survey.html?g=colleghi`: e'
il parametro `g` che finisce nella colonna `gruppo`.

## Come leggere i dati

- **Una riga per confronto, l'ultima vale.** Se un rispondente torna indietro e
  cambia risposta parte una seconda riga con lo stesso `interview_id` e lo
  stesso `confronto`: tieni quella con il `timestamp` piu' recente.
- **Direzione della domanda.** Con `direzione = sinistra` l'outlet in `risposta`
  e' quello giudicato piu' a sinistra; con `destra` quello piu' a destra. Prima
  della stima va riportato tutto alla stessa direzione.
- **Pareggi e non so.** `uguali` e' un pareggio (modello di Davidson);
  `nonso` si scarta dalla stima ma si conta per la riconoscibilita'.
- **Questionari completi.** Sono gli `interview_id` con la riga `sezione = fine`.
  Quelli senza riga finale sono parziali, ma i confronti risposti restano utili.
- **Rispondenti ripetuti.** `respondent_id` e' lo stesso per tutti i questionari
  fatti dallo stesso browser: serve per un effetto del valutatore nel modello.
- **Estrazione.** Nel foglio "MBI Estrazione" tieni solo le righe il cui
  `interview_id` ha la riga `fine` nel foglio delle risposte, separa per
  `gruppo`, ed estrai tre righe a caso: ogni riga e' una partecipazione, quindi
  chi ha completato piu' questionari ha piu' probabilita'. Dopo l'estrazione
  cancella le email.
