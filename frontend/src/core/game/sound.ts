// Sons et musique des jeux, synthetises avec WebAudio : aucun fichier a charger.
import { useSyncExternalStore } from 'react'
import { readStorage, writeStorage } from '@/core/lib/storage'

export type Sfx =
  | 'click'
  | 'step'
  | 'turn'
  | 'pick'
  | 'bump'
  | 'cat'
  | 'lock'
  | 'open'
  | 'star'
  | 'win'
  | 'hint'
  | 'hop'
  | 'drop'
  | 'alert'
export type MusicMood = 'garden' | 'temple' | 'quest'

const STORAGE_KEY = 'najahni.coding.muted'

let context: AudioContext | null = null
let muted = readStorage(STORAGE_KEY) === '1'
const listeners = new Set<() => void>()

/** Le navigateur n'autorise le son qu'apres un geste de l'eleve (clic). */
function audio() {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return null
  }
}

interface Note {
  /** Frequence en Hz, et frequence d'arrivee pour un glissando. */
  f: number
  to?: number
  at?: number
  dur: number
  type?: OscillatorType
  gain?: number
}

function play(ctx: AudioContext, { f, to, at = 0, dur, type = 'sine', gain = 0.12 }: Note) {
  const start = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const volume = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(f, start)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur)
  volume.gain.setValueAtTime(0.0001, start)
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  volume.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(volume).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

const arpeggio = (notes: number[], step: number, dur: number, type: OscillatorType, gain: number): Note[] =>
  notes.map((f, i) => ({ f, at: i * step, dur, type, gain }))

const SOUNDS: Record<Sfx, Note[]> = {
  click: [{ f: 660, dur: 0.06, type: 'triangle', gain: 0.07 }],
  step: [{ f: 300, to: 420, dur: 0.07, type: 'triangle', gain: 0.06 }],
  turn: [{ f: 420, to: 340, dur: 0.08, type: 'triangle', gain: 0.05 }],
  pick: arpeggio([784, 1047, 1319], 0.06, 0.14, 'triangle', 0.1),
  bump: [
    { f: 140, to: 70, dur: 0.2, type: 'square', gain: 0.1 },
    { f: 90, dur: 0.12, at: 0.05, type: 'sawtooth', gain: 0.05 },
  ],
  cat: [
    { f: 520, to: 880, dur: 0.18, type: 'sawtooth', gain: 0.07 },
    { f: 880, to: 300, dur: 0.32, at: 0.17, type: 'sawtooth', gain: 0.07 },
  ],
  lock: arpeggio([196, 185], 0.09, 0.14, 'square', 0.07),
  open: [
    { f: 110, to: 220, dur: 0.6, type: 'sawtooth', gain: 0.05 },
    ...arpeggio([392, 523, 659, 784], 0.11, 0.3, 'triangle', 0.09),
  ],
  star: arpeggio([1047, 1568], 0.07, 0.18, 'sine', 0.11),
  win: arpeggio([523, 659, 784, 1047, 784, 1047, 1319], 0.1, 0.26, 'triangle', 0.11),
  hint: arpeggio([880, 1175], 0.08, 0.16, 'sine', 0.07),
  hop: [{ f: 340, to: 680, dur: 0.12, type: 'triangle', gain: 0.07 }],
  drop: [
    { f: 520, to: 180, dur: 0.16, type: 'sine', gain: 0.1 },
    { f: 120, dur: 0.08, at: 0.14, type: 'triangle', gain: 0.08 },
  ],
  alert: arpeggio([988, 1319, 988, 1319], 0.09, 0.12, 'square', 0.05),
}

export function sfx(name: Sfx) {
  if (muted) return
  const ctx = audio()
  if (ctx) SOUNDS[name].forEach((note) => play(ctx, note))
}

// Musique d'ambiance : une melodie qui se promene dans une gamme, jamais deux fois pareille
const SCALES: Record<MusicMood, { notes: number[]; beat: number; type: OscillatorType }> = {
  // Do majeur pentatonique : le jardin, leger
  garden: { notes: [262, 294, 330, 392, 440, 523, 587, 659], beat: 520, type: 'triangle' },
  // Maqam hijaz sur Re : le temple, mysterieux
  temple: { notes: [147, 156, 185, 196, 220, 233, 262, 294], beat: 760, type: 'sine' },
  // La mineur pentatonique : l'aventure, entrainante
  quest: { notes: [220, 262, 294, 330, 392, 440, 523, 587], beat: 430, type: 'triangle' },
}

let musicTimer: number | undefined
let wanted: MusicMood | null = null

function tick(mood: MusicMood, position: number, beat: number) {
  const { notes, beat: ms, type } = SCALES[mood]
  const ctx = muted ? null : audio()
  if (ctx) {
    if (beat % 2 === 0 || Math.random() < 0.35) play(ctx, { f: notes[position], dur: (ms / 1000) * 1.7, type, gain: 0.028 })
    if (beat % 8 === 0) play(ctx, { f: notes[0] / 2, dur: (ms / 1000) * 5, type: 'sine', gain: 0.035 })
  }
  const next = Math.min(notes.length - 1, Math.max(0, position + Math.floor(Math.random() * 5) - 2))
  musicTimer = window.setTimeout(() => tick(mood, next, beat + 1), ms)
}

export function startMusic(mood: MusicMood) {
  if (wanted === mood) return
  stopMusic()
  wanted = mood
  tick(mood, 3, 0)
}

export function stopMusic() {
  wanted = null
  window.clearTimeout(musicTimer)
}

export function toggleSound() {
  muted = !muted
  writeStorage(STORAGE_KEY, muted ? '1' : '0')
  listeners.forEach((l) => l())
}

/** Vrai quand le son est coupe. */
export const useMuted = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => muted,
  )
