/**
 * Minimal s200 app — the whole surface in a few plain calls: create the
 * data object, register routes, export it. `bun --watch server.ts` and
 * `bun server.ts` both consume this module.
 */
import type { App } from 's200';

import { createApp, get, json } from 's200';

export const app: App = createApp();

get(app, '/', (ctx) => json(ctx, { hello: 'world' }));

get(app, '/hello/:name', (ctx) => json(ctx, { hello: ctx.params.name }));
