# Guida alla configurazione di Google Forms per MBI

Questa guida ti aiuterà a configurare il Google Form per raccogliere le risposte del questionario.

## Passaggio 1: Crea un nuovo Google Form

1. Vai su [Google Forms](https://forms.google.com)
2. Clicca su **+ Vuoto** per creare un nuovo modulo
3. Dai un titolo al form: **MBI Survey Responses** (questo non sarà visibile agli utenti)

## Passaggio 2: Aggiungi i campi

Crea i seguenti campi nel form (tutti come **Risposta breve**):

| Campo | Nome del campo | Tipo |
|-------|---------------|------|
| 1 | respondent_id | Risposta breve |
| 2 | timestamp | Risposta breve |
| 3 | interview_id | Risposta breve |
| 4 | comparison_id | Risposta breve |
| 5 | outlet_left_codename | Risposta breve |
| 6 | outlet_right_codename | Risposta breve |
| 7 | chosen_outlet_codename | Risposta breve |
| 8 | section_type | Risposta breve |
| 9 | email | Risposta breve |

**Importante:** Non rendere nessun campo obbligatorio.

## Passaggio 3: Ottieni l'URL del form e gli entry ID

### Metodo 1: Usando l'anteprima del form

1. Clicca su **Anteprima** (icona occhio in alto a destra)
2. Fai clic destro sulla pagina e seleziona **Visualizza sorgente pagina**
3. Cerca `entry.` nel codice sorgente
4. Troverai gli ID come: `entry.123456789`

### Metodo 2: Usando l'URL del form precompilato

1. Clicca sui tre puntini (⋮) in alto a destra
2. Seleziona **Ottieni link precompilato**
3. Compila tutti i campi con testo di esempio
4. Clicca **Ottieni link**
5. L'URL conterrà tutti gli entry ID nel formato:
   ```
   https://docs.google.com/forms/d/e/FORM_ID/viewform?entry.111111=test&entry.222222=test...
   ```

## Passaggio 4: Copia il Form ID e l'URL di risposta

L'URL del form avrà questo formato:
```
https://docs.google.com/forms/d/e/1FAIpQLSc...FORM_ID.../viewform
```

L'URL per l'invio delle risposte è:
```
https://docs.google.com/forms/d/e/1FAIpQLSc...FORM_ID.../formResponse
```

## Passaggio 5: Configura il file script.js

Apri il file `assets/script.js` e modifica la sezione CONFIG all'inizio del file:

```javascript
const CONFIG = {
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/IL_TUO_FORM_ID/formResponse',
  FORM_FIELDS: {
    respondent_id: 'entry.XXXXXXXXX',      // Sostituisci con il tuo entry ID
    timestamp: 'entry.XXXXXXXXX',          // Sostituisci con il tuo entry ID
    interview_id: 'entry.XXXXXXXXX',       // Sostituisci con il tuo entry ID
    comparison_id: 'entry.XXXXXXXXX',      // Sostituisci con il tuo entry ID
    outlet_left_codename: 'entry.XXXXXXXXX', // Sostituisci con il tuo entry ID
    outlet_right_codename: 'entry.XXXXXXXXX', // Sostituisci con il tuo entry ID
    chosen_outlet_codename: 'entry.XXXXXXXXX', // Sostituisci con il tuo entry ID
    section_type: 'entry.XXXXXXXXX',       // Sostituisci con il tuo entry ID
    email: 'entry.XXXXXXXXX'               // Sostituisci con il tuo entry ID
  },
  // ... resto della configurazione
};
```

## Passaggio 6: Configura le impostazioni del form

1. Vai nelle **Impostazioni** del form (icona ingranaggio)
2. In **Risposte**:
   - ✅ Raccogli indirizzi email: **No** (lo facciamo noi)
   - ✅ Limita a 1 risposta: **No**
   - ✅ Modifica dopo l'invio: **No**

3. In **Presentazione**:
   - Disattiva il messaggio di conferma (non verrà mostrato)

## Passaggio 7: Collega a Google Sheets (opzionale ma consigliato)

1. Clicca sulla scheda **Risposte**
2. Clicca sull'icona di Google Sheets (verde)
3. Seleziona **Crea un nuovo foglio di calcolo**
4. Le risposte saranno automaticamente salvate nel foglio

## Passaggio 8: Testa il sistema

1. Avvia un server locale per testare:
   ```bash
   cd /path/to/mediabiasitaly.github.io
   python3 -m http.server 8000
   ```
2. Apri `http://localhost:8000` nel browser
3. Completa il questionario
4. Verifica che le risposte appaiano nel Google Form/Sheet

## Struttura dei dati raccolti

Ogni riga nel foglio di calcolo rappresenta un singolo confronto e conterrà:

| Campo | Descrizione | Esempio |
|-------|-------------|---------|
| respondent_id | UUID univoco del rispondente | `a1b2c3d4-e5f6-7890-...` |
| timestamp | Data e ora della risposta | `2026-01-20T15:30:00.000Z` |
| interview_id | ID dell'intervista | `lx1abc2de` |
| comparison_id | ID del confronto | `1-3` (sezione 1, confronto 3) |
| outlet_left_codename | Codice outlet a sinistra | `tg1` |
| outlet_right_codename | Codice outlet a destra | `tg5` |
| chosen_outlet_codename | Scelta del rispondente | `tg1` o `dk` |
| section_type | Tipo di sezione | `tg`, `talk`, `press`, `radio`, `mixed` |
| email | Email (se fornita) | `esempio@mail.com` o `NA` |

## Note importanti

- **Le risposte vengono inviate in tempo reale**: ogni confronto viene salvato immediatamente, anche se il rispondente non completa il questionario
- **L'email viene aggiunta alla fine**: quando l'utente inserisce l'email nella pagina finale, tutte le sue risposte vengono reinviate con l'email associata
- **Se l'utente non completa**: avrai comunque le risposte parziali, con `NA` nel campo email

## Risoluzione problemi

### Le risposte non vengono salvate

1. Verifica che l'URL del form sia corretto (deve terminare con `/formResponse`)
2. Controlla che tutti gli entry ID siano corretti
3. Apri la console del browser (F12) e cerca errori

### CORS errors

I Google Forms usano la modalità `no-cors`, quindi non vedrai errori di rete nella console. Se le risposte non appaiono:
1. Verifica manualmente inviando il form dal browser
2. Controlla gli entry ID

### Il form chiede il login

Vai nelle impostazioni del form e assicurati che **non** sia richiesto l'accesso con account Google.
