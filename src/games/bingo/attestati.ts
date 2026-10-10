import type { TipoEvento } from '../../eventi/types'
import type { FormaCartella } from './generator'

/** Un premio del bingo: dall'ambo fino alla cartella piena. */
export interface Premio {
  id: string
  nome: string
  /** Quante caselle bisogna barrare. */
  caselle: number
  tipo: 'parziale' | 'riga' | 'bingo'
}

const NOMI = ['Ambo', 'Terna', 'Quaterna', 'Cinquina', 'Sestina']

/**
 * I premi dipendono dalla forma delle cartelle: con 5 colonne si va
 * dall'ambo alla cinquina, con 4 ci si ferma alla quaterna, e cosi' via.
 * L'ultimo e' sempre il bingo, la cartella piena.
 */
export function premiPer(forma: FormaCartella): Premio[] {
  const premi: Premio[] = []
  for (let caselle = 2; caselle <= forma.colonne; caselle++) {
    const nome = NOMI[caselle - 2]
    premi.push({
      id: nome.toLowerCase(),
      nome,
      caselle,
      tipo: caselle === forma.colonne ? 'riga' : 'parziale',
    })
  }
  premi.push({ id: 'bingo', nome: 'Bingo', caselle: forma.colonne * forma.righe, tipo: 'bingo' })
  return premi
}

export function motivazione(premio: Premio, tipoEvento: TipoEvento): string {
  // la lode c'e' solo alla laurea, come il 110
  const conferito = premio.tipo === 'bingo' && tipoEvento === 'laurea' ? 'conferito con lode' : 'conferito'
  switch (premio.tipo) {
    case 'parziale':
      return `${conferito} per aver barrato ${premio.caselle} caselle sulla stessa riga`
    case 'riga':
      return `${conferito} per aver completato una riga intera`
    case 'bingo':
      return `${conferito} per aver barrato tutte e ${premio.caselle} le caselle`
  }
}

/** Con le cartelle 5x3 restano i voti dell'attestato originale. */
const VOTI_CLASSICI = [66, 80, 95, 105]
const LIVELLI_FESTA = ['buono', 'ottimo', 'spettacolare', 'epico', 'stellare']

/**
 * L'ultima riga dell'attestato: una piccola scala che cresce con il premio,
 * diversa per ogni tipo di festa. Il premio piu' alto ha sempre la sua battuta.
 */
export function ultimaRiga(tipoEvento: TipoEvento, indice: number, totale: number): string {
  const ultimo = indice === totale - 1
  switch (tipoEvento) {
    case 'laurea': {
      if (ultimo) return 'Votazione finale: 110 e lode'
      const quanti = totale - 1
      const voto =
        quanti === VOTI_CLASSICI.length
          ? VOTI_CLASSICI[indice]
          : quanti === 1
            ? 66
            : Math.round(66 + ((105 - 66) * indice) / (quanti - 1))
      return `Votazione finale: ${voto}`
    }
    case 'compleanno':
      return ultimo ? 'Candeline spente: tutte, al primo soffio!' : `Candeline spente: ${indice + 1}`
    case 'matrimonio':
      return ultimo ? 'Confetti vinti: la bomboniera intera!' : `Confetti vinti: ${indice * 2 + 1}`
    case 'anniversario':
      return ultimo ? 'Anni di felicità augurati: per sempre' : `Anni di felicità augurati: ${(indice + 1) * 10}`
    default:
      return `Livello di festa: ${ultimo ? 'leggendario' : LIVELLI_FESTA[indice]}`
  }
}

/** Le caselle da segnare nella mini-cartella: la prima riga da sinistra, o tutte. */
export function caselleVincenti(premio: Premio, forma: FormaCartella): boolean[] {
  return Array.from({ length: forma.colonne * forma.righe }, (_, i) =>
    premio.tipo === 'bingo' ? true : i < premio.caselle,
  )
}
