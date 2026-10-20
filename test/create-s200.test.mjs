/**
 * create-s200 scaffolder tests: spawn the real bin with node, scaffold
 * into tmp dirs, assert the generated file sets and manifest rewrites.
 * No network, no install — the bin only copies files.
 */
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const run = promisify(execFile);
const BIN = fileURLToPath(new URL('../bin/create-s200.mjs', import.meta.url));

/** execFile rejections resolve to the child error (undefined when the call
 *  unexpectedly succeeds — the assertions below then fail on it). */
async function rejectionOf(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('create-s200', () => {
  const roots = [];
  after(async () => {
    await Promise.all(roots.map((dir) => rm(dir, { recursive: true, force: true })));
  });

  const tmpTarget = async (name) => {
    const root = await mkdtemp(join(tmpdir(), 'create-s200-'));
    roots.push(root);
    return { root, target: join(root, name) };
  };

  const scaffold = (target, ...args) => run(process.execPath, [BIN, target, ...args]);

  it('scaffolds node-minimal — the default runtime when stdin is not a TTY', async () => {
    const { target } = await tmpTarget('my-app');
    const { stdout } = await scaffold(target); // no --runtime: piped stdin → node
    assert.ok(stdout.includes('my-app'));
    assert.ok(stdout.includes('npm run dev'));

    assert.deepEqual((await readdir(target)).sort(), [
      'README.md',
      'app.test.ts',
      'app.ts',
      'package.json',
      'server.ts',
    ]);
    const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'my-app');
    assert.deepEqual(pkg.dependencies, { s200: 'latest' });
    assert.equal(pkg.scripts.dev, 's200 dev ./app.ts');
    assert.equal(pkg.scripts.start, 'node server.ts');
    assert.equal(pkg.scripts.test, 'node --test');
    assert.ok((await readFile(join(target, 'app.ts'), 'utf8')).includes('createApp'));
    assert.ok((await readFile(join(target, 'server.ts'), 'utf8')).includes('s200/node'));
  });

  it('scaffolds node-rest with --template rest', async () => {
    const { target } = await tmpTarget('my-rest-app');
    await scaffold(target, '--runtime', 'node', '--template', 'rest');
    assert.deepEqual((await readdir(target)).sort(), [
      'README.md',
      'app.test.ts',
      'app.ts',
      'package.json',
      'server.ts',
      'types.ts',
    ]);
    const app = await readFile(join(target, 'app.ts'), 'utf8');
    assert.ok(app.includes("get(app, '/articles/:id'"));
    assert.ok(app.includes('s200/logger'));
    assert.equal(
      JSON.parse(await readFile(join(target, 'package.json'), 'utf8')).name,
      'my-rest-app'
    );
  });

  it('scaffolds bun-minimal with --runtime bun', async () => {
    const { target } = await tmpTarget('my-bun-app');
    await scaffold(target, '--runtime', 'bun');
    assert.deepEqual((await readdir(target)).sort(), [
      'README.md',
      'app.test.ts',
      'app.ts',
      'package.json',
      'server.ts',
    ]);
    assert.ok((await readFile(join(target, 'server.ts'), 'utf8')).includes('s200/bun'));
    assert.equal(
      JSON.parse(await readFile(join(target, 'package.json'), 'utf8')).name,
      'my-bun-app'
    );
  });

  it('scaffolds cloudflare-minimal with --runtime cloudflare', async () => {
    const { target } = await tmpTarget('my-worker');
    await scaffold(target, '--runtime', 'cloudflare');
    assert.deepEqual((await readdir(target)).sort(), [
      'README.md',
      'app.test.ts',
      'app.ts',
      'package.json',
      'wrangler.toml',
    ]);
    const app = await readFile(join(target, 'app.ts'), 'utf8');
    assert.ok(app.includes('createHandler'));
    assert.ok(app.includes('export default'));
    assert.ok(
      (await readFile(join(target, 'wrangler.toml'), 'utf8')).includes('name = "my-worker"')
    );
  });

  it('refuses a non-empty target without --force and succeeds with it', async () => {
    const { target } = await tmpTarget('occupied');
    await mkdir(target);
    await writeFile(join(target, 'keep.txt'), 'precious');

    const refusal = await rejectionOf(scaffold(target, '--runtime', 'node'));
    assert.ok(refusal);
    assert.notEqual(refusal.code, 0);
    assert.ok(refusal.stderr.includes('--force'));
    assert.deepEqual(await readdir(target), ['keep.txt']); // nothing was copied

    const { stdout } = await scaffold(target, '--runtime', 'node', '--force');
    assert.ok(stdout.includes('occupied'));
    assert.deepEqual((await readdir(target)).sort(), [
      'README.md',
      'app.test.ts',
      'app.ts',
      'keep.txt', // --force merges over the existing content
      'package.json',
      'server.ts',
    ]);
  });

  it('exits non-zero with usage for an unknown runtime', async () => {
    const { target } = await tmpTarget('nope');
    const error = await rejectionOf(scaffold(target, '--runtime', 'fastly'));
    assert.ok(error);
    assert.notEqual(error.code, 0);
    assert.ok(error.stderr.includes('usage:'));
    assert.ok(error.stderr.includes('fastly'));
  });

  it('exits non-zero when the runtime/template combination has no template', async () => {
    const { target } = await tmpTarget('no-rest-here');
    const error = await rejectionOf(scaffold(target, '--runtime', 'bun', '--template', 'rest'));
    assert.ok(error);
    assert.ok(error.stderr.includes('no template for bun-rest'));
  });

  it('scaffolds into the cwd when the target is literally "."', async () => {
    const { root } = await tmpTarget('dot-target');
    await run(process.execPath, [BIN, '.', '--runtime', 'node'], { cwd: root });
    const files = (await readdir(root)).sort();
    assert.ok(files.includes('app.ts'));
    assert.ok(files.includes('package.json'));
  });

  it('rejects a second positional argument — "." is a target, not a sentinel', async () => {
    const { root } = await tmpTarget('dot-extra');
    const error = await rejectionOf(
      run(process.execPath, [BIN, '.', 'extra-arg'], { cwd: root })
    );
    assert.ok(error);
    assert.ok(error.stderr.includes('unexpected argument "extra-arg"'));
    // Nothing was scaffolded anywhere — no silent ./extra-arg directory.
    assert.equal((await readdir(root)).length, 0);
  });
});
