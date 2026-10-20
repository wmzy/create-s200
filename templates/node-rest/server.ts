/**
 * Production entry — `npm start`. One server, no watcher; the app itself
 * lives in app.ts.
 */
import { serve } from 's200/node';

import { app } from './app.ts';

const server = await serve(app, { port: Number(process.env.PORT ?? 3000) });
console.log(`listening on ${server.url}`);
