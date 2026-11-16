// Lance n8n sur ce PC, sans Docker : node automation/start-n8n.mjs
// Avec --import, charge d'abord le workflow de l'agent (automation/najahni-agent.workflow.json).
// n8n garde ses donnees dans une base PostgreSQL "n8n", separee de celle de Najahni.
// (npx n8n seul echoue ici : il n'installe pas le module natif de SQLite.)
// La connexion et la cle de l'agent viennent de api/.env : aucun secret n'est ecrit ici.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const apiDir = fileURLToPath(new URL('../api/', import.meta.url));
const workflow = fileURLToPath(new URL('najahni-agent.workflow.json', import.meta.url));
const pg = createRequire(`${apiDir}package.json`)('pg');

const env = Object.fromEntries(
  readFileSync(`${apiDir}.env`, 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const at = l.indexOf('=');
      return [l.slice(0, at), l.slice(at + 1).replace(/^["']|["']$/g, '')];
    }),
);
if (!env.DATABASE_URL) throw new Error('DATABASE_URL introuvable dans api/.env');
const url = new URL(env.DATABASE_URL);

const admin = new URL(url);
admin.pathname = '/postgres';
admin.search = '';
const client = new pg.Client({ connectionString: admin.href });
await client.connect();
const { rowCount } = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'n8n'`);
if (!rowCount) {
  await client.query(`CREATE DATABASE n8n ENCODING 'UTF8' TEMPLATE template0`);
  console.log('Base "n8n" creee');
}
await client.end();

const n8nEnv = {
  ...process.env,
  DB_TYPE: 'postgresdb',
  DB_POSTGRESDB_HOST: url.hostname,
  DB_POSTGRESDB_PORT: url.port || '5432',
  DB_POSTGRESDB_DATABASE: 'n8n',
  DB_POSTGRESDB_USER: decodeURIComponent(url.username),
  DB_POSTGRESDB_PASSWORD: decodeURIComponent(url.password),
  GENERIC_TIMEZONE: 'Africa/Tunis',
  // Le webhook n'a pas de mot de passe : il ne repond qu'a ce PC
  N8N_LISTEN_ADDRESS: '127.0.0.1',
  // Le workflow lit la cle et l'adresse de l'API ici, pas dans son fichier
  N8N_BLOCK_ENV_ACCESS_IN_NODE: 'false',
  AGENT_API_KEY: env.AGENT_API_KEY,
  NAJAHNI_API: `http://localhost:${env.PORT ?? 3000}/api`,
};

const run = (args) =>
  new Promise((done) => {
    const child = spawn('npx', ['--yes', 'n8n', ...args], { stdio: 'inherit', shell: true, env: n8nEnv });
    child.on('exit', (code) => done(code ?? 0));
  });

if (process.argv.includes('--import')) {
  const code = await run([`import:workflow`, `--input="${workflow}"`]);
  if (code) process.exit(code);
}
process.exit(await run([]));
