/**
 * Gabarit pour du code / des algorithmes sur plusieurs lignes : garde les `\` tels quels
 * (String.raw), retire la premiere ligne vide et l'indentation commune.
 */
export function code(strings: TemplateStringsArray, ...values: unknown[]) {
  const raw = String.raw({ raw: strings }, ...values).replace(/^\n/, '');
  const lines = raw.replace(/\s+$/, '').split('\n');
  const indent = Math.min(
    ...lines
      .filter((l) => l.trim())
      .map((l) => l.length - l.trimStart().length),
  );
  return lines.map((l) => l.slice(indent)).join('\n');
}
