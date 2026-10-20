# cloudflare-minimal

A minimal s200 Cloudflare Worker.

- `npm run dev` — `wrangler dev`, the local worker on `:8787`.
- `npm run deploy` — `wrangler deploy`.
- `npm test` — plain `node:test`: the app is runtime-agnostic, so tests
  exercise it in-process with `request` from `s200/test`, no wrangler.

`app.ts` exports the app for tests and the worker's module default via
`createHandler(app)` from `s200/cloudflare`.
