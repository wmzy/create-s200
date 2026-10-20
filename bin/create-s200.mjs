#!/usr/bin/env node
/**
 * create-s200 — zero-dependency project scaffolder.
 *
 * Copies a template from ./templates/<runtime>-<template>/ into the target
 * directory and rewrites the manifest `name` to the directory's basename.
 * Plain Node ESM, node: builtins only — no install step, no dependencies.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const RUNTIMES = ['node', 'bun', 'deno', 'cloudflare'];
const TEMPLATE_KINDS = ['minimal', 'rest'];

const USAGE = `usage: create-s200 [target-dir] [--runtime node|bun|deno|cloudflare] [--template rest|minimal] [--force]

  target-dir    where to scaffold (default .)
  --runtime     node | bun | deno | cloudflare — prompted when stdin is a
                TTY, defaults to node otherwise
  --template    minimal | rest (default minimal)
  --force       scaffold into a non-empty directory`;

const fail = (message) => {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
};

const parseArgs = (argv) => {
  const args = { target: '.', runtime: undefined, template: 'minimal', force: false };
  let sawTarget = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--force') {
      args.force = true;
    } else if (arg === '--runtime' || arg === '--template') {
      const value = argv[(i += 1)];
      if (value === undefined) {
        fail(`create-s200: ${arg} requires a value`);
      }
      if (arg === '--runtime') {
        args.runtime = value;
      } else {
        args.template = value;
      }
    } else if (arg.startsWith('--runtime=') || arg.startsWith('--template=')) {
      const eq = arg.indexOf('=');
      const value = arg.slice(eq + 1);
      if (arg.startsWith('--runtime=')) {
        args.runtime = value;
      } else {
        args.template = value;
      }
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else if (arg.startsWith('--')) {
      fail(`create-s200: unknown option "${arg}"`);
    } else if (sawTarget) {
      fail(`create-s200: unexpected argument "${arg}"`);
    } else {
      args.target = arg;
      sawTarget = true;
    }
  }
  return args;
};

/** Prompts for the runtime — only reached when stdin is a TTY. */
const askRuntime = async () => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(`Target runtime (${RUNTIMES.join('/')}): `)).trim().toLowerCase();
  } finally {
    rl.close();
  }
};

/** Rewrites a JSON manifest's `name` (package.json / deno.json), if present. */
const rewriteJsonName = (path, name) => {
  if (!existsSync(path)) {
    return;
  }
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  manifest.name = name;
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
};

/** Rewrites wrangler.toml's top-level `name = "…"` line, if present. */
const rewriteTomlName = (path, name) => {
  if (!existsSync(path)) {
    return;
  }
  writeFileSync(path, readFileSync(path, 'utf8').replace(/^name = ".*"$/m, `name = "${name}"`));
};

const NEXT_STEPS = {
  node: ['npm install', 'npm run dev   # s200 dev — hot reload', 'npm start      # plain server', 'npm test'],
  bun: ['bun install', 'bun run dev    # bun --watch', 'bun run start  # plain server', 'bun test'],
  deno: ['deno task dev    # deno run --watch app.ts', 'deno task start  # serve on :8000', 'deno test'],
  cloudflare: ['npm install', 'npm run dev     # wrangler dev (local worker)', 'npm run deploy  # wrangler deploy', 'npm test'],
};

const [, , ...argv] = process.argv;
const args = parseArgs(argv);

let runtime = args.runtime;
if (runtime === undefined) {
  runtime = process.stdin.isTTY ? await askRuntime() : 'node';
}
runtime = String(runtime).toLowerCase();
if (!RUNTIMES.includes(runtime)) {
  fail(`create-s200: unknown runtime "${runtime}" (expected ${RUNTIMES.join('|')})`);
}
if (!TEMPLATE_KINDS.includes(args.template)) {
  fail(`create-s200: unknown template "${args.template}" (expected ${TEMPLATE_KINDS.join('|')})`);
}

const templateDir = join(TEMPLATES_DIR, `${runtime}-${args.template}`);
if (!existsSync(templateDir)) {
  const available = readdirSync(TEMPLATES_DIR)
    .filter((entry) => !entry.startsWith('.'))
    .join(', ');
  fail(`create-s200: no template for ${runtime}-${args.template} (available: ${available})`);
}

const target = resolve(args.target);
mkdirSync(target, { recursive: true });
if (readdirSync(target).length > 0 && !args.force) {
  fail(`create-s200: ${target} is not empty (use --force to scaffold anyway)`);
}

// Copy top-level entries individually: cpSync(templateDir, target) with an
// existing target would nest the template's basename inside it.
for (const entry of readdirSync(templateDir)) {
  cpSync(join(templateDir, entry), join(target, entry), { recursive: true });
}

const name = basename(target);
rewriteJsonName(join(target, 'package.json'), name);
rewriteJsonName(join(target, 'deno.json'), name);
rewriteTomlName(join(target, 'wrangler.toml'), name);

console.log(`Scaffolded ${name} (${runtime}-${args.template}) in ${target}\n`);
console.log('Next steps:');
if (args.target !== '.') {
  console.log(`  cd ${args.target}`);
}
for (const step of NEXT_STEPS[runtime]) {
  console.log(`  ${step}`);
}
