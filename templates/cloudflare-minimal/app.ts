/**
 * Minimal s200 worker: the app (plain data + functions), plus the
 * module-worker default export wrangler wants. Tests import the same
 * `app` — the core never touches platform APIs.
 */
import type { App } from 's200';

import { createApp, get, json } from 's200';
import { createHandler } from 's200/cloudflare';

export const app: App = createApp();

get(app, '/', (ctx) => json(ctx, { hello: 'workers' }));

get(app, '/hello/:name', (ctx) => json(ctx, { hello: ctx.params.name }));

export default createHandler(app);
