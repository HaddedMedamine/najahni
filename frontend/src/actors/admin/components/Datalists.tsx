// Suggestions pour les champs niveau / section (saisie libre possible)
export const LEVELS = ['Bac', '4ème', '3ème', '2ème', '1ère', '9ème']
export const SECTIONS = ['Info', 'Sciences', 'Math', 'Eco', 'Technique', 'Lettres']

export function LevelSectionDatalists() {
  return (
    <>
      <datalist id="levels">
        {LEVELS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <datalist id="sections">
        {SECTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  )
}
