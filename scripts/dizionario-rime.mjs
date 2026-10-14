/**
 * Costruisce public/rime/parole.txt, il dizionario usato dall'aiuto rime del
 * papiro. Si lancia una volta sola (o per aggiornarlo):
 *
 *   node scripts/dizionario-rime.mjs
 *
 * Mette insieme due fonti:
 * - napolux/paroleitaliane (MIT): un dizionario, ma senza frequenze e con
 *   buchi strani (mancano "casa", "studio", "voto", ...);
 * - hermitdave/FrequencyWords (CC BY-SA 4.0): le 50.000 parole piu' usate nei
 *   sottotitoli, con la frequenza ma anche nomi stranieri e accenti persi.
 *
 * Il risultato e' una parola per riga, dalla piu' comune: l'aiuto rime propone
 * prima le parole che si usano davvero.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const NAPOLUX = 'https://raw.githubusercontent.com/napolux/paroleitaliane/main/paroleitaliane/'
const FREQUENZE = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt'

const SOLO_LETTERE = /^[a-zàèéìíòóùú]+$/
const ACCENTI = { a: ['à'], e: ['è', 'é'], i: ['ì'], o: ['ò'], u: ['ù'], 'è': ['é'], 'é': ['è'] }

async function scarica(indirizzo) {
  const risposta = await fetch(indirizzo)
  if (!risposta.ok) throw new Error(`${indirizzo}: ${risposta.status}`)
  return (await risposta.text())
    .split('\n')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean)
}

const [sessantamila, duecentottantamila, comuni, nomiPropri, righeFrequenze] = await Promise.all([
  scarica(`${NAPOLUX}60000_parole_italiane.txt`),
  scarica(`${NAPOLUX}280000_parole_italiane.txt`),
  scarica(`${NAPOLUX}1000_parole_italiane_comuni.txt`),
  scarica(`${NAPOLUX}9000_nomi_propri.txt`),
  scarica(FREQUENZE),
])

const FINISCE_IN_VOCALE = /[aeiouàèéìòù]$/
const valide = (elenco) => elenco.filter((p) => p.length >= 2 && SOLO_LETTERE.test(p))
const base = valide([...comuni, ...sessantamila])
// il 280.000 contiene anche nomi stranieri (henry, morgan): se ne tengono
// solo le parole che finiscono in vocale, come quasi tutte quelle italiane
const dizionario = new Set([...base, ...valide(duecentottantamila).filter((p) => FINISCE_IN_VOCALE.test(p))])
const frequenti = valide(righeFrequenze.map((r) => r.split(' ')[0]))
const nomi = new Set(nomiPropri)
const posizione = new Map(frequenti.map((p, i) => [p, i]))

/**
 * "perche" o "perchè" quando "perché" e' piu' frequente: accenti persi o
 * sbagliati. "voto" invece resta, anche se esiste "votò".
 */
function haGemelloAccentato(parola) {
  return (ACCENTI[parola.at(-1)] ?? []).some((accentata) => {
    const gemella = parola.slice(0, -1) + accentata
    return dizionario.has(gemella) && (posizione.get(gemella) ?? Infinity) < (posizione.get(parola) ?? Infinity)
  })
}

/**
 * "voto" manca dal dizionario ma c'e' "voti": se cambiando solo la vocale
 * finale si trova una parola del dizionario, e' quasi certamente italiana.
 * I nomi stranieri dei sottotitoli (mike, kate, grace) non passano.
 */
function haSorella(parola) {
  if (nomi.has(parola) || !/[aeio]$/.test(parola)) return false
  const radice = parola.slice(0, -1)
  return ['a', 'e', 'i', 'o'].some((v) => v !== parola.at(-1) && dizionario.has(radice + v))
}

const risultato = []
const presi = new Set()
function prendi(parola) {
  if (presi.has(parola)) return
  presi.add(parola)
  risultato.push(parola)
}

// prima le parole frequenti: quelle del dizionario e, delle altre, quelle con
// l'accento finale ("uscirà") o con una sorella nel dizionario ("voto")
for (const parola of frequenti) {
  if (dizionario.has(parola)) prendi(parola)
  else if (haGemelloAccentato(parola)) continue
  else if (/[àèéìòù]$/.test(parola) || haSorella(parola)) prendi(parola)
}
// poi il resto del dizionario di base, senza le forme piu' rare del 280.000
for (const parola of base) prendi(parola)

const cartella = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'rime')
mkdirSync(cartella, { recursive: true })
writeFileSync(join(cartella, 'parole.txt'), risultato.join('\n') + '\n')
console.log(`${risultato.length} parole scritte in public/rime/parole.txt`)
