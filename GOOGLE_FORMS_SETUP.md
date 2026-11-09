# Collegare MBI ai Google Form

Il sito invia i dati a **due** Google Form, tenuti separati di proposito:

| Form | Cosa raccoglie | Righe |
|---|---|---|
| **MBI Risposte** | i confronti a coppie e le domande finali | una per confronto, piu' una finale per questionario |
| **MBI Estrazione** | le email per l'estrazione | una per ogni questionario completo con email |

I due form hanno in comune `interview_id` (il singolo questionario) e
`respondent_id` (il browser). Servono a contare quante partecipazioni ha ogni
email e a controllare come ha risposto chi partecipa all'estrazione, ma le email
non stanno nello stesso foglio delle risposte (e' quello che dice l'informativa
del sito).

Finche' i codici non sono configurati il sito funziona lo stesso: non invia
niente e scrive nella console del browser (F12, scheda Console) le righe che
avrebbe inviato, con il prefisso `[MBI, form non configurato]`. E' il modo piu'
comodo per provarlo.

Tempo necessario: circa 20 minuti.

---

## Passo 1. Crea il form "MBI Risposte"

1. Vai su [forms.google.com](https://forms.google.com) e crea un modulo vuoto.
2. Titolo: `MBI Risposte` (i rispondenti non lo vedono mai).
3. Aggiungi **18 domande**, tutte di tipo **Risposta breve**, con questi titoli e
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
| 15 | `ms_risposta` | millisecondi fra la comparsa della coppia e la risposta; vuoto nella riga finale |
| 16 | `inizio` | ora di inizio del questionario, solo nella riga finale |
| 17 | `durata_sec` | secondi dall'inizio alla fine, pause comprese, solo nella riga finale |
| 18 | `durata_attiva_sec` | somma dei tempi di risposta in secondi, senza le pause, solo nella riga finale |

4. **Nessuna domanda obbligatoria.**

## Passo 2. Crea il form "MBI Estrazione"

Stessa procedura, titolo `MBI Estrazione`, **5 domande** di tipo Risposta breve:

| # | Titolo della domanda |
|---|---|
| 1 | `email` |
| 2 | `gruppo` |
| 3 | `interview_id` |
| 4 | `timestamp` |
| 5 | `respondent_id` |

## Passo 3. Pubblica i form e controlla le impostazioni

Dal 2025 un Google Form nuovo non riceve risposte finche' non viene pubblicato,
e finche' non e' pubblicato il menu non mostra "Ottieni link precompilato".
Per ciascuno dei due form:

1. In alto a destra clicca **Pubblica**.
2. Nella finestra che si apre, alla voce sui rispondenti scegli **Chiunque abbia
   il link**. Se il form e' limitato a un'organizzazione o a persone specifiche,
   gli invii dal sito vengono rifiutati senza errori visibili.
3. Conferma con **Pubblica**.

Poi, nell'ingranaggio **Impostazioni**:

- **Risposte, Raccogli indirizzi email**: *Non raccogliere* (l'email la mandiamo noi).
- **Risposte, Limita a 1 risposta**: disattivato. Se e' attivo Google chiede il
  login e il sito non riesce a scrivere.

## Passo 4. Recupera gli identificativi

Per ciascun form servono due cose: l'**ID del form** (uno per form) e l'**entry
ID** di ogni domanda (un numero per domanda). Si leggono tutti in un unico link,
il "link precompilato".

1. Apri il form in modifica (la pagina dove hai scritto le domande).
2. In alto a destra, accanto al pulsante **Pubblica**, c'e' un'icona con **tre
   puntini verticali**. Cliccala e scegli **Ottieni link precompilato**. Si apre
   una nuova scheda con il form come lo vede un rispondente.
3. In ogni campo scrivi **il nome del campo stesso**: nel campo `respondent_id`
   scrivi `respondent_id`, nel campo `interview_id` scrivi `interview_id`, e cosi'
   via per tutti. Serve solo a riconoscere i numeri nel link.
4. In fondo al form clicca **Ottieni link**, poi, nel riquadro che compare in
   basso, **Copia link**.
5. Incolla il link in un file di testo. E' fatto cosi' (qui spezzato su piu' righe
   per leggibilita'):

```
https://docs.google.com/forms/d/e/1FAIpQLSdAbCdEf123456/viewform?usp=pp_url
  &entry.111111111=respondent_id
  &entry.222222222=interview_id
  &entry.333333333=gruppo
  ...
```

6. Leggilo cosi':
   - l'**ID del form** e' il pezzo lungo fra `/d/e/` e `/viewform`
     (nell'esempio `1FAIpQLSdAbCdEf123456`);
   - ogni coppia `entry.NUMERO=nome` ti dice che il campo `nome` ha come entry ID
     `entry.NUMERO` (nell'esempio `gruppo` e' `entry.333333333`).

Fai la stessa cosa per l'altro form. Alla fine hai due link, uno per form.

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
- **Collegare le email alle risposte.** Unisci i due fogli su `interview_id`:
  per ogni partecipazione all'estrazione hai tutte le risposte di quel
  questionario. `respondent_id` (presente in entrambi) raggruppa i questionari
  fatti dallo stesso browser, anche quelli senza email.
- **Tempi e rispondenti troppo veloci.** Nella riga finale `durata_attiva_sec`
  e' il tempo effettivo di risposta (le pause non contano); `durata_sec` include
  le pause e le interruzioni. Per togliere i piu' veloci usa `durata_attiva_sec`
  (per esempio il primo 1-5% della distribuzione, separatamente per gruppo). Per
  il singolo confronto c'e' `ms_risposta`: risposte sotto i 700-800 millisecondi
  sono difficilmente lette. Un altro segnale di risposte a caso e' scegliere quasi
  sempre l'outlet nella stessa posizione (`risposta` uguale a `outlet_a`, oppure
  sempre a `outlet_b`): con le posizioni casuali la quota attesa e' circa meta'.
  Nota: se un rispondente torna indietro e risponde di nuovo, `ms_risposta`
  della nuova riga misura solo l'ultima visualizzazione.
- **Rispondenti ripetuti.** `respondent_id` e' lo stesso per tutti i questionari
  fatti dallo stesso browser: serve per un effetto del valutatore nel modello.
- **Estrazione.** Nel foglio "MBI Estrazione" tieni solo le righe il cui
  `interview_id` ha la riga `fine` nel foglio delle risposte, separa per
  `gruppo`, ed estrai tre righe a caso: ogni riga e' una partecipazione, quindi
  chi ha completato piu' questionari ha piu' probabilita'. Dopo l'estrazione
  cancella le email.
