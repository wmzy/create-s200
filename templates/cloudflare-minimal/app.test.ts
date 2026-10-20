/**
 * Plain `node:test` against the app itself — the core is runtime-agnostic,
 * so no wrangler (or Workers runtime) is involved. `request` from s200/test
 * dispatches in-process.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { request } from 's200/test';

import { app } from './app.ts';

test('GET / greets workers', async () => {
  const res = await request(app, '/');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { hello: 'workers' });
});

test('GET /hello/:name captures the param', async () => {
  const res = await request(app, '/hello/ada');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { hello: 'ada' });
});
