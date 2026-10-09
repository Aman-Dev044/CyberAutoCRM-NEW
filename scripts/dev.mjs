/**
 * Dev runner for the split-port layout: API on :2442, web UI on :2552.
 *
 *   node scripts/dev.mjs        both instances, output prefixed [api] / [web]
 *   node scripts/dev.mjs api    just the API instance
 *   node scripts/dev.mjs web    just the web instance
 *
 * Each instance gets its own build folder (.next-api / .next-web). Two Next
 * dev servers sharing one `.next` overwrite each other's chunks and start
 * serving broken JavaScript, so this is not optional.
 *
 * Set NEXT_PUBLIC_API_BASE / CORS_ALLOWED_ORIGINS in .env.local for the
 * browser to actually route its API calls to :2442.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const INSTANCES = {
  api: { port: 2442, distDir: '.next-api', color: '\x1b[36m' }, // cyan
  web: { port: 2552, distDir: '.next-web', color: '\x1b[35m' }, // magenta
};

const RESET = '\x1b[0m';
const requested = process.argv.slice(2).filter((a) => a in INSTANCES);
const names = requested.length ? requested : Object.keys(INSTANCES);

const children = [];
let shuttingDown = false;

function start(name) {
  const { port, distDir, color } = INSTANCES[name];
  const label = `${color}[${name}]${RESET}`;

  const child = spawn(
    process.execPath,
    [require$resolveNextBin(), 'dev', '-p', String(port)],
    {
      env: { ...process.env, NEXT_DIST_DIR: distDir, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  const pipe = (stream, isError) => {
    let buffer = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const out = isError ? process.stderr : process.stdout;
        out.write(`${label} ${line}\n`);
      }
    });
  };

  pipe(child.stdout, false);
  pipe(child.stderr, true);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    process.stdout.write(`${label} exited (${signal ?? code}) — stopping the rest\n`);
    shutdown(code ?? 1);
  });

  children.push(child);
  process.stdout.write(`${label} starting on http://localhost:${port} (distDir ${distDir})\n`);
}

/** Resolve Next's own CLI entry so this works regardless of PATH or shell. */
function require$resolveNextBin() {
  return new URL('../node_modules/next/dist/bin/next', import.meta.url).pathname.replace(
    /^\/([A-Za-z]:)/,
    '$1',
  );
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

names.forEach(start);
