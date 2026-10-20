# node-minimal

A minimal s200 app on `node:http`.

- `npm run dev` — `s200 dev ./app.ts`: hot reload via atomic route-table
  swap (in-flight requests finish on the old chain; the entry exports the
  app as `app`).
- `npm start` — `node server.ts`, the plain production server (`PORT`
  overrides the port).
- `npm test` — plain `node:test` with the in-process `request` helper.

Running the TypeScript entry directly needs Node ≥ 23.6 (native type
stripping), or ≥ 22.6 with `NODE_OPTIONS=--experimental-strip-types`.
