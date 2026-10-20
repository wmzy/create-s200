/**
 * Minimal s200 app on Deno — `s200` resolves through the `npm:` import
 * map in deno.json, serving goes through the `s200/deno` adapter. Run
 * directly (`deno run app.ts`) or import from tests — the import.meta.main
 * guard keeps `deno test` from starting a server.
 */
import type { App } from 's200';

import { createApp, get, json } from 's200';
import { serve } from 's200/deno';

export const app: App = createApp();

get(app, '/', (ctx) => json(ctx, { hello: 'deno' }));

get(app, '/hello/:name', (ctx) => json(ctx, { hello: ctx.params.name }));

if (import.meta.main) {
  const server = serve(app, { port: Number(Deno.env.get('PORT') ?? 8000) });
  console.log(`listening on ${server.url}`);
}
