# deno-minimal

A minimal s200 app on Deno.

- `deno task dev` — `deno run --watch app.ts`.
- `deno task start` — serve on `:8000` (`PORT` overrides).
- `deno test` — the `node:test` file through Deno's compat layer; the
  in-process `request` helper needs no server.

`s200` itself resolves through the `npm:` import map in `deno.json` —
`npm:s200@latest` and its subpath exports (`/deno`, `/test`).
