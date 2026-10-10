# I giochi per gli eventi

Sito per raccogliere in anticipo il materiale dei giochi di una festa (laurea,
compleanno, matrimonio, …) e per condurre il gioco della serata. Nato per la
laurea di Sara, ora ospita più eventi contemporaneamente, ognuno con i suoi
utenti, i suoi festeggiati e il suo colore.

- **Cruci{Nome}**: gli invitati propongono parola e definizione, il sito
  costruisce da solo il cruciverba da scaricare in PDF o PNG.
- **Bingo{Nome}**: gli invitati scrivono cosa pensano succederà durante la
  festa, e da quelle previsioni nascono le cartelle del bingo da stampare.
- **Cash or {Nome}**: il gioco della serata. Si proietta un oggetto per volta e
  tutti indovinano quanto vale dal telefono, entrando dal QR senza password.

Con un solo festeggiato i titoli giocano sul suo nome (CruciSara, BingoSara,
Cash or Sara); con più festeggiati diventano Cruciverba, Bingo e Cash or Trash.
L'organizzatore può comunque riscriverli.

## Come funziona

- **React + Vite + TypeScript + Tailwind**, tutto lato browser.
- **Firebase Firestore** come archivio condiviso, **Firebase Authentication**
  per l'accesso. Tutto sul piano gratuito (Spark): niente Cloud Functions,
  niente Storage.
- Nessun server da gestire: il sito è statico e sta su GitHub Pages.

## Chi è chi

| Ruolo | Utente | Cosa fa |
|---|---|---|
| **superadmin** | `oder` | vede tutti gli eventi nella dashboard, li crea ed elimina, vede e cambia le password, entra in ogni evento con i poteri dell'admin |
| **admin** dell'evento | `<evento>-admin` | imposta la festa (tipo, festeggiati, colore, giochi, presentatore), modera, stampa e conduce Cash or … |
| **ospiti** dell'evento | `<evento>-ospiti` | un solo accesso per tutti gli invitati: propongono parole e previsioni |
| **giocatori** | nessuno | entrano dal QR di Cash or … senza password |

| | ospiti | admin | oder |
|---|---|---|---|
| Vedere e aggiungere parole e previsioni | sì | sì | sì, in ogni evento |
| Anteprima del cruciverba | sì (dietro avviso spoiler) | sì | sì |
| Modificare / eliminare | no | sì | sì |
| Generare e scaricare cartelle e cartelloni | no | sì | sì |
| Condurre Cash or … | no | sì | sì |
| Impostazioni dell'evento | no | sì | sì |
| Vedere l'accesso per gli invitati | no | sì | sì |
| Creare ed eliminare eventi, cambiare password | no | no | sì |

## Il giro di un evento

1. Oder, dalla dashboard, crea l'evento con un nome breve (es. `sara25`).
   Il sito crea gli utenti `sara25-admin` e `sara25-ospiti` con password
   casuali e mostra il messaggio pronto da mandare all'organizzatore.
2. L'organizzatore entra e compila le **Impostazioni**. Finché non lo fa, gli
   invitati vedono solo "Stiamo preparando la festa".
3. Dalla home l'organizzatore copia il messaggio con l'accesso degli invitati e
   lo manda nel gruppo.
4. Finita la festa, Oder elimina l'evento: spariscono dati e utenti.

## Comandi

```bash
npm run dev      # sviluppo su http://localhost:5173
npm run build    # compila in dist/
npm run preview  # prova il risultato compilato
npm run deploy   # compila e pubblica su GitHub Pages
```

## Configurazione Firebase

1. Le chiavi del progetto stanno in `.env` (non finisce su git). Il modello è
   in `.env.example`.
2. **Authentication → Metodo di accesso**: attivi **Email/password** e
   **Anonimo** (serve al QR di Cash or …).
3. **Authentication → Impostazioni → Azioni utente**: **creazione** ed
   **eliminazione** degli utenti devono essere abilitate. Il sito le usa per
   creare e cancellare gli utenti degli eventi. Chi si registrasse per conto
   suo non avrebbe un documento in `utenti/` e le regole gli negherebbero tutto.
4. **Authentication → Impostazioni → Domini autorizzati**: `iioderii.github.io`.
5. **Authentication → Utenti**: l'unico utente creato a mano è
   `oder@eventi.local`. Il dominio è fittizio: nel login si scrive solo `oder`.
   Il suo UID va scritto sia in `src/config.ts` (`SUPERADMIN_UID`) sia in
   `firestore.rules` (funzione `superadmin()`).
6. **Firestore → Regole**: si incolla [`firestore.rules`](./firestore.rules) e
   si pubblica. **Vanno ripubblicate ogni volta che cambiano.**

## I dati su Firestore

```
utenti/{uid}                          { eventoId, ruolo: 'admin' | 'ospiti', username }
credenziali/{eventoId}                utenti e password generate (Oder e admin dell'evento)
eventi/{eventoId}                     tipo, festeggiati, dettaglio, data, colore, giochi, presentatore
eventi/{eventoId}/parole/...          cruciverba
eventi/{eventoId}/frasi/...           bingo
eventi/{eventoId}/oggetti/...         Cash or …: con la valutazione vera, solo admin
eventi/{eventoId}/media/presentatore  la foto del presentatore, solo admin
eventi/{eventoId}/partita/corrente    stato della partita, letto da tutti i telefoni
eventi/{eventoId}/partita/vetrina     la foto dell'oggetto in gioco
eventi/{eventoId}/partita/corrente/giocatori/...
eventi/{eventoId}/partita/corrente/risposte/...
```

Le regole leggono `utenti/{uid}` per sapere a quale evento appartiene chi fa
la richiesta: un utente vede e scrive solo dentro il proprio evento.

### Perché le password sono salvate

Dal browser Firebase non lascia gestire gli account degli altri: per
eliminare un utente o cambiargli la password bisogna entrarci. Il sito lo fa
da una seconda istanza di Firebase (`src/admin/account.ts`) che non tocca
l'accesso di Oder, e per questo conserva le password in `credenziali/`,
leggibili solo da Oder e dall'admin di quell'evento. Per un sito di giochi è
un compromesso ragionevole e permette di restare sul piano gratuito.

## Il colore

L'admin sceglie un colore (ce ne sono alcuni già provati, oppure uno libero).
Il CSS ricava tutte le sfumature `primario-50 … 900` dalla sola variabile
`--primario` (vedi `src/index.css`), che `applicaColore` in
`src/eventi/colore.ts` cambia entrando nell'evento. PDF, PNG e QR non leggono
le variabili CSS: ricevono il colore come parametro.

## Struttura

```
src/
  admin/       dashboard di Oder, creazione eventi, account e credenziali
  auth/        accesso e protezione delle pagine
  eventi/      tipi, contesto dell'evento, colore, impostazioni
  components/  intestazione, icone, pezzi condivisi
  games/
    registry.ts          elenco dei giochi (qui si aggiungono i prossimi)
    shared/              hook Firestore, numeri casuali, nome del giocatore
    cruciverba/          form, elenco, algoritmo, anteprima, PDF e PNG
    bingo/               form, elenco, generatore di cartelle, PDF
    cashorsara/          regia, proiezione, pagina del giocatore, punteggi
  pages/       ingresso (smista per ruolo) e home dell'evento
  config.ts    nome del sito, dominio degli utenti, UID di Oder
```

### Aggiungere un gioco nuovo

1. Creare `src/games/<nome>/` con la sua pagina; per la parte dati basta
   `useRaccolta('eventi/<id evento>/<collezione>')` da
   `src/games/shared/raccolta.ts`.
2. Aggiungere l'id a `IdGioco` e a `GIOCHI_PREDEFINITI` in
   `src/eventi/types.ts`, il titolo automatico in `titoloPredefinito`, e una
   voce in `src/games/registry.ts`: rotte, menu, tessere della home e
   impostazioni si aggiornano da sole.
3. Aggiungere le regole della nuova collezione dentro `match /eventi/{eventoId}`
   in `firestore.rules`, aggiungere la collezione a `SOTTOCOLLEZIONI` in
   `src/admin/gestioneEventi.ts` (per l'eliminazione) e ripubblicare le regole.

## Come è costruito il cruciverba

L'algoritmo (`src/games/cruciverba/generator.ts`) parte dalla parola più lunga
e prova a incastrare le altre su ogni lettera in comune, scartando i
piazzamenti che creerebbero accostamenti non validi. Tra i piazzamenti legali
sceglie quello con più incroci e che fa crescere meno la griglia. L'intera
costruzione viene ripetuta decine di volte con ordini diversi e viene tenuto il
risultato migliore. Le parole che non entrano finiscono in un elenco a parte,
visibile solo all'admin.

Il cartellone (`poster.ts`) calcola una volta sola le posizioni in millimetri, e
le usano sia il PDF (`exportPdf.ts`) sia l'immagine PNG (`exportImage.ts`), che
restano così identici. Se le definizioni risultassero troppo piccole, viene
rimpicciolita la griglia invece del testo, fino a un minimo scrivibile a mano.

## Come sono costruite le cartelle del bingo

Il generatore (`src/games/bingo/generator.ts`) distribuisce le previsioni in
parti uguali: a ogni cartella tocca prima chi è comparso meno volte finora,
così nessuna frase resta inutilizzata e nessuna finisce su tutte le cartelle.
Ogni cartella è diversa dalle altre e, con lo stesso seme, anteprima e PDF
coincidono.

La stampa (`exportCartelle.ts`) prova tutte le disposizioni possibili sul foglio
A4 e tiene quella che fa uscire le caselle più grandi. Restano 10 mm di margine
di sicurezza e 6 mm fra una cartella e l'altra per passare con le forbici. Sul
retro possono andare le regole del gioco.

### Gli attestati per i vincitori

Sotto le cartelle l'admin scarica un attestato per ogni premio, in quattro
stili: Classico (l'originale della laurea di Sara, con alloro e cornice
dorata), Festoso, Elegante e Pop. I premi seguono la forma scelta per le
cartelle: con 5 colonne si va dall'ambo alla cinquina, poi il bingo.

- `attestati.ts` decide i contenuti: premi, motivazioni e l'ultima riga, che
  cambia con il tipo di festa (i voti per la laurea, le candeline per il
  compleanno, i confetti per il matrimonio, …).
- `stampaAttestati.ts` li disegna. Come nell'originale, più grande il premio
  più grande l'attestato: dall'ambo su un cartoncino 10×15 fino al bingo su
  tutto il foglio. Tutto è disegnato su un cartoncino 10×15 e poi scalato,
  quindi ogni stile funziona a ogni misura. Si possono anche avere tutti 10×15.

## Come funziona Cash or …

Tre viste sullo stesso momento di gioco, tenute in sincrono da Firestore:

- `/e/<evento>/cashorsara`: la **regia**. Prepara gli oggetti (nome, storia,
  foto, valutazione vera) e comanda la partita. Solo admin.
- `/e/<evento>/proiezione`: lo **schermo**. In attesa mostra il QR e chi è
  entrato, durante il gioco l'oggetto con quanti hanno già puntato, poi la
  rivelazione e la classifica. Ha una piccola barra comandi, perché con il
  portatile che duplica la TV aprire la regia mostrerebbe a tutti la
  valutazione vera.
- `/e/<evento>/gioca`: il **telefono** dell'invitato (nome, cifra, esito).

La valutazione vera vive solo nella collezione `oggetti`, leggibile dal solo
admin. Entra nel documento della partita soltanto quando la si rivela.

**Le letture gratuite.** Il piano Spark concede circa 50.000 letture al giorno
su tutto il progetto. Per questo i telefoni ascoltano solo quattro documenti:
la partita, la vetrina con la foto, il proprio giocatore e la propria puntata.
Esiti dell'oggetto e classifica li calcola chi rivela il valore (regia o
proiezione) e li salva dentro la partita. Così ogni passo del gioco costa una
lettura per telefono, invece di una per ogni puntata di ogni altro giocatore.
La foto dell'oggetto sta nella vetrina, a parte, perché pesa centinaia di KB e
dentro la partita viaggerebbe a ogni cambio di stato.

**L'identità del telefono.** La pagina del QR entra con un'identità anonima
tutta sua (`src/games/cashorsara/istanzaGioco.ts`), separata dall'accesso del
sito. Senza questa separazione chi ha già fatto login come `<evento>-ospiti`
giocherebbe con l'utente condiviso da tutti gli invitati.

I punteggi sono 100 punti meno la percentuale di errore, più 20 a chi si
avvicina di più. Regia e proiezione li ricalcolano sempre dalle puntate, così
chi entra a metà partita o corregge una puntata non manda niente fuori sincrono.

Le foto vengono ridotte nel browser prima di essere salvate, perché Firebase
Storage non è disponibile sul piano gratuito. Quella del presentatore conserva
la trasparenza, così una foto scontornata resta scontornata.

## Pubblicazione

```bash
git add . && git commit -m "descrizione" && git push
npm run deploy
```

Il sito è su **https://iioderii.github.io/i_giochi_per_gli_eventi/**
