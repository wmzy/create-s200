/** Plain `node:test` CRUD round-trip — dispatches in-process, no port. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { request } from 's200/test';

import { app } from './app.ts';

const postArticle = (body: unknown) =>
  request(app, '/articles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

test('lists and reads articles', async () => {
  assert.equal((await request(app, '/articles')).status, 200);
  assert.equal((await request(app, '/articles/a1')).status, 200);
  assert.equal((await request(app, '/articles/missing')).status, 404);
});

test('creates, updates, deletes', async () => {
  const created = await postArticle({ title: 'T', body: 'B' });
  assert.equal(created.status, 201);
  const { id } = (await created.json()) as { id: string };

  const updated = await request(app, `/articles/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'T2', body: 'B2' }),
  });
  assert.equal((await updated.json()).title, 'T2');
  assert.equal((await request(app, `/articles/${id}`, { method: 'DELETE' })).status, 200);
  assert.equal((await request(app, `/articles/${id}`)).status, 404);
});

test('rejects a malformed body with 422', async () => {
  assert.equal((await postArticle({ title: 42 })).status, 422);
});
