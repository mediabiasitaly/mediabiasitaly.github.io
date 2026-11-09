# MBI - Media Bias in Italy

Sito statico (GitHub Pages) del questionario MBI: confronti a coppie fra mezzi di
informazione italiani, per stimarne la posizione sinistra-destra con un modello
Bradley-Terry.

| Pagina | Cosa fa |
|---|---|
| `index.html` | presentazione del progetto, senza link al questionario |
| `studenti.html` | presentazione per studenti, premi: buoni caffe' del Campus Luigi Einaudi, chiusura 9 dicembre 2026 |
| `colleghi.html` | presentazione per colleghi, premi: buoni Amazon, chiusura 31 gennaio 2027 |
| `survey.html` | il questionario (`?g=studenti` o `?g=colleghi`) |
| `thankyou.html` | pagina della versione precedente, rimanda alla home |

- Outlet: `data/outlets.csv`, generato da `outletSelection/syntax/03_selezione.R`
  (colonne `codename,name,type,pic,mixed,echobit`). Non modificarlo a mano: si
  rigenera lo script e si copia qui il file `output/outlets.csv`.
- Loghi: `assets/loghi/<codename>.png`, preparati da `MBI/logos/manipola_loghi.py`
  a partire dagli originali in `MBI/logos/original/`. `03_selezione.R` riempie la
  colonna `pic` per ogni codename che ha il suo file.
- Configurazione (form, numero di confronti per sezione, testi dei premi): blocco
  `CONFIG` in cima a `assets/script.js`.
- Collegamento ai Google Form: `GOOGLE_FORMS_SETUP.md`.
- Specifiche: `mbi_website.md`.
