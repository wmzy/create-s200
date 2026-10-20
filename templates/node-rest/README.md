# node-rest

A REST slice on s200: in-memory article CRUD with JSON bodies, `httpError`
status mapping, and the `s200/logger` battery.

- `npm run dev` — `s200 dev ./app.ts`: hot reload via atomic route-table
  swap (in-flight requests finish on the old chain).
- `npm start` — `node server.ts`, the plain production server (`PORT`
  overrides the port).
- `npm test` — plain `node:test` CRUD round-trip against the real app.

Running the TypeScript entry directly needs Node ≥ 23.6 (native type
stripping), or ≥ 22.6 with `NODE_OPTIONS=--experimental-strip-types`.
