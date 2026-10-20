/**
 * Plain `node:test` — runs under `bun test` (Bun maps it to its own
 * runner) or `node --test`. `request` from s200/test dispatches
 * in-process, so these never bind a port.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { request } from 's200/test';

import { app } from './app.ts';

test('GET / greets the world', async () => {
  const res = await request(app, '/');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { hello: 'world' });
});

test('GET /hello/:name captures the param', async () => {
  const res = await request(app, '/hello/ada');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { hello: 'ada' });
});
