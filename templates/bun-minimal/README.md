# bun-minimal

A minimal s200 app on `Bun.serve` (adapter: `s200/bun`).

- `bun run dev` — `bun --watch server.ts`: Bun's own watcher restarts the
  process on change.
- `bun run start` — `bun server.ts`, the plain server (`PORT` overrides
  the port).
- `bun test` — the `node:test` file runs under Bun's runner; `request`
  from `s200/test` dispatches in-process.
