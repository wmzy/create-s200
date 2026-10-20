# create-s200

Zero-dependency scaffolder for [s200](https://github.com/wmzy/s200) apps —
plain Node ESM, no install step, no dependencies:

```sh
npm create s200@latest my-app              # prompts for the runtime on a TTY
npm create s200@latest my-app -- --runtime bun
```

Also directly:

```sh
npx create-s200 my-app --runtime node --template rest
```

## Usage

```
usage: create-s200 [target-dir] [--runtime node|bun|deno|cloudflare] [--template rest|minimal] [--force]

  target-dir    where to scaffold (default .)
  --runtime     node | bun | deno | cloudflare — prompted when stdin is a
                TTY, defaults to node otherwise
  --template    minimal | rest (default minimal)
  --force       scaffold into a non-empty directory
```

The scaffolder copies the chosen template into the target directory
(refusing a non-empty one without `--force`) and rewrites the manifest
`name` — `package.json`, `deno.json`, and `wrangler.toml` where present —
to the directory's basename.

## Templates

| Template                | Runtime    | Entry                                 |
| ----------------------- | ---------- | ------------------------------------- |
| `node-minimal`          | Node       | `createApp` + `s200/node` `serve`     |
| `node-rest`             | Node       | in-memory article CRUD + `s200/logger` |
| `bun-minimal`           | Bun        | `createApp` + `s200/bun` `serve`      |
| `deno-minimal`          | Deno       | `s200/deno` `serve`, `npm:` import map |
| `cloudflare-minimal`    | Workers    | `export default createHandler(app)`   |

Every template exports the app from `app.ts` (named `app`), serves through
its runtime's adapter, and tests with plain `node:test` (or Deno's compat
layer) using the in-process `request` helper from `s200/test` — no test
framework dependency.

Not every runtime × template combination exists yet; the scaffolder lists
what's available when you ask for a missing one.

## Development

Plain Node, no build step, no dependencies. Run the scaffolder tests:

```sh
npm test
```
