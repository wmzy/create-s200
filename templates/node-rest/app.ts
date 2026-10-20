/**
 * REST slice: an in-memory article store, JSON bodies, typed errors, the
 * logger battery. Data + functions all the way down — no classes.
 */
import type { App, Ctx } from 's200';
import type { Article } from './types.ts';

import { createApp, del, get, httpError, json, post, put, readJson, use } from 's200';
import { logger } from 's200/logger';

export const app: App = createApp();

use(app, logger());

/** The store — plain data, lives as long as the process does. */
export const articles: Article[] = [{ id: 'a1', title: 'Hello s200', body: 'First post.' }];
let nextId = 2;

const findArticle = (id: string): Article => {
  const article = articles.find((entry) => entry.id === id);
  if (article === undefined) {
    throw httpError(404, 'article not found');
  }
  return article;
};

/** Body parse + validation — throwing httpError maps to that status. */
const readArticle = async (ctx: Ctx): Promise<Omit<Article, 'id'>> => {
  const body = (await readJson(ctx)) as Partial<Record<keyof Article, unknown>>;
  if (typeof body.title !== 'string' || typeof body.body !== 'string') {
    throw httpError(422, 'expected { title: string, body: string }');
  }
  return { title: body.title, body: body.body };
};

get(app, '/articles', (ctx) => json(ctx, articles));

get(app, '/articles/:id', (ctx) => json(ctx, findArticle(ctx.params.id ?? '')));

post(app, '/articles', async (ctx) => {
  const input = await readArticle(ctx);
  const article = { id: `a${nextId++}`, ...input };
  articles.push(article);
  return json(ctx, article, { status: 201 });
});

put(app, '/articles/:id', async (ctx) => {
  const existing = findArticle(ctx.params.id ?? '');
  Object.assign(existing, await readArticle(ctx));
  return json(ctx, existing);
});

del(app, '/articles/:id', (ctx) => {
  findArticle(ctx.params.id ?? '');
  articles.splice(
    articles.findIndex((entry) => entry.id === ctx.params.id),
    1
  );
  return json(ctx, { deleted: true });
});
