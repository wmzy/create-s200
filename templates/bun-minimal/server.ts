/**
 * Bun entry — `bun run start` (plain) or `bun run dev` (watch). The app
 * itself lives in app.ts.
 */
import { serve } from 's200/bun';

import { app } from './app.ts';

const server = serve(app, { port: Number(process.env.PORT ?? 3000) });
console.log(`listening on ${server.url}`);
