/**
 * `node:test` through Deno's compat layer — `deno test` discovers the
 * `*_test.ts` suffix and maps the imports. `request` from s200/test
 * dispatches in-process, so these never bind a port.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { request } from 's200/test';

import { app } from './app.ts';

test('GET / greets deno', async () => {
  const res = await request(app, '/');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { hello: 'deno' });
});

test('GET /hello/:name captures the param', async () => {
  const res = await request(app, '/hello/ada');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { hello: 'ada' });
});
