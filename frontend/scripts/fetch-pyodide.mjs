// Prepare public/pyodide : le moteur Python (copie de node_modules/pyodide) et les
// paquets numpy / pandas (telecharges une seule fois, verifies par sha256).
// Lance automatiquement avant `npm run dev` et `npm run build` ; ne refait rien si tout est la.
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'node_modules', 'pyodide')
const target = join(root, 'public', 'pyodide')
const { version } = require('pyodide/package.json')
const lock = require('pyodide/pyodide-lock.json')

// Fichiers du moteur (le reste du paquet npm sert a Node, pas au navigateur)
const CORE = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']
// Paquets utilises par les exercices (numpy : tableaux, pandas : Bac Eco), avec leurs dependances
const PACKAGES = ['numpy', 'pandas']
const CDN = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`

const exists = (path) =>
  stat(path).then(
    () => true,
    () => false,
  )
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

function withDependencies(names) {
  const all = new Set()
  const visit = (name) => {
    if (all.has(name)) return
    all.add(name)
    for (const dep of lock.packages[name].depends ?? []) visit(dep)
  }
  names.forEach(visit)
  return [...all].map((name) => lock.packages[name])
}

await mkdir(target, { recursive: true })

for (const file of CORE) {
  await copyFile(join(source, file), join(target, file))
}

for (const pkg of withDependencies(PACKAGES)) {
  const dest = join(target, pkg.file_name)
  if ((await exists(dest)) && sha256(await readFile(dest)) === pkg.sha256) continue
  process.stdout.write(`pyodide: telechargement de ${pkg.file_name}... `)
  const res = await fetch(CDN + pkg.file_name)
  if (!res.ok) throw new Error(`${pkg.file_name} : HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  if (sha256(buffer) !== pkg.sha256) throw new Error(`${pkg.file_name} : sha256 invalide`)
  await writeFile(dest, buffer)
  console.log('ok')
}

console.log(`pyodide ${version} pret dans public/pyodide`)
