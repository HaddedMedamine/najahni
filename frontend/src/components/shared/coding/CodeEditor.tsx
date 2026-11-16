import { indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { EditorState, StateEffect, StateField } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, keymap } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { basicSetup } from 'codemirror'
import { type Ref, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@/core/lib/utils'

/** Lignes mises en evidence : celle executee pendant l'animation, celle de l'erreur. */
interface Marks {
  run: number | null
  error: number | null
}

const setMarks = StateEffect.define<Marks>()

const marksField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, tr) {
    let next = decorations.map(tr.changes)
    for (const effect of tr.effects) {
      if (!effect.is(setMarks)) continue
      const { doc } = tr.state
      const ranges = [
        { line: effect.value.error, className: 'cm-error-line' },
        { line: effect.value.run, className: 'cm-run-line' },
      ]
        .filter((m): m is { line: number; className: string } => m.line !== null && m.line >= 1 && m.line <= doc.lines)
        .map((m) => ({ from: doc.line(m.line).from, className: m.className }))
        .sort((a, b) => a.from - b.from)
        .map((m) => Decoration.line({ class: m.className }).range(m.from))
      next = Decoration.set(ranges, true)
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

const theme = EditorView.theme({
  '&': { fontSize: '14px', backgroundColor: 'var(--card)', color: 'var(--foreground)', height: '100%' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.6' },
  '.cm-gutters': { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', border: 'none' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'color-mix(in srgb, var(--primary) 6%, transparent)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-run-line': { backgroundColor: 'color-mix(in srgb, var(--primary) 22%, transparent)' },
  '.cm-error-line': { backgroundColor: 'color-mix(in srgb, var(--danger) 22%, transparent)' },
})

/** Couleurs du code sur le fond sombre des jeux. */
const gameHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword, tags.operatorKeyword], color: '#ff9ecb', fontWeight: '600' },
  { tag: [tags.string], color: '#a8e6a3' },
  { tag: [tags.number, tags.bool], color: '#ffc857' },
  { tag: [tags.comment], color: '#8796b8', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.standard(tags.variableName)], color: '#7fd4ff' },
  { tag: [tags.heading], color: '#c9a7ff', fontWeight: '700' },
])

const KEYWORDS =
  /^(si|alors|sinon|finsi|pour|de|à|a|faire|finpour|tantque|fintantque|répéter|repeter|jusqu'à|jusqu'a|retourner|fin)\b/i
const STRUCTURE = /^(algorithme|debut|début|fonction|procédure|procedure|types?|enregistrement|tableau|lignes?|colonnes?)\b/i
const OPERATORS = /^(div|mod|et|ou|non)\b/i
const BUILTINS =
  /^(lire_ligne|lire|ecrire_nl|ecrire|ouvrir|fermer|fin_fichier|long|pos|sous_chaine|effacer|majus|convch|valeur|estnum|ord|chr|aléa|alea|ent|arrondi|racinecarré|racinecarre|abs)\b/i

/** Coloration de la notation algorithmique. */
const algoLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.match(/^#.*/) || stream.match(/^\/\/.*/)) return 'comment'
    if (stream.match(/^"[^"]*"?/) || stream.match(/^'[^']*'?/)) return 'string'
    if (stream.match(/^\d+(\.\d+)?/)) return 'number'
    if (stream.match(/^(vrai|faux)\b/i)) return 'bool'
    if (stream.match(STRUCTURE)) return 'heading'
    if (stream.match(KEYWORDS)) return 'keyword'
    if (stream.match(OPERATORS)) return 'operatorKeyword'
    if (stream.match(BUILTINS)) return 'standard'
    if (stream.match(/^[\p{L}_][\p{L}\p{N}_]*/u)) return 'variableName'
    stream.next()
    return null
  },
  tokenTable: { standard: tags.standard(tags.variableName), heading: tags.heading, operatorKeyword: tags.operatorKeyword },
})

/** Pour inserer du texte depuis un bouton (symboles, instructions). */
export interface CodeEditorHandle {
  insert: (text: string) => void
}

interface Props {
  value: string
  onChange?: (value: string) => void
  language?: 'python' | 'algo'
  /** Ligne en cours d'execution (animation du jeu). */
  runLine?: number | null
  errorLine?: number | null
  readOnly?: boolean
  /** Couleurs du code pour le fond sombre des jeux. */
  game?: boolean
  className?: string
  handle?: Ref<CodeEditorHandle>
}

/** Editeur de code (CodeMirror 6). Le code est toujours ecrit de gauche a droite. */
export function CodeEditor({
  value,
  onChange,
  language = 'python',
  runLine = null,
  errorLine = null,
  readOnly,
  game,
  className,
  handle,
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useImperativeHandle(handle, () => ({
    insert(text) {
      const editor = view.current
      if (!editor) return
      editor.dispatch(editor.state.replaceSelection(text))
      editor.focus()
    },
  }))

  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          ...(game ? [syntaxHighlighting(gameHighlight)] : []),
          basicSetup,
          language === 'algo' ? algoLanguage : python(),
          keymap.of([indentWithTab]),
          theme,
          marksField,
          EditorState.readOnly.of(Boolean(readOnly)),
          EditorView.editable.of(!readOnly),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current?.(update.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = editor
    return () => editor.destroy()
    // L'editeur est cree une seule fois ; `value` est synchronise ci-dessous
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, language, game])

  // Valeur changee de l'exterieur (reinitialisation, autre niveau)
  useEffect(() => {
    const editor = view.current
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } })
    }
  }, [value])

  useEffect(() => {
    view.current?.dispatch({ effects: setMarks.of({ run: runLine, error: errorLine }) })
  }, [runLine, errorLine])

  return (
    <div
      ref={host}
      dir="ltr"
      className={cn('overflow-hidden rounded-xl border border-border [&_.cm-editor]:h-full', className)}
    />
  )
}
