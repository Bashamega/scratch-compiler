# @scratch-compiler/cli

Compiles a Scratch `.sb3` project into a small static site (HTML + JS + assets).

## Install

```bash
npm i -g @scratch-compiler/cli
```

Or run without installing:

```bash
npx @scratch-compiler/cli <file.sb3> <output-dir>
```

## Usage

```bash
scratch-compile path/to/project.sb3 out
```

This writes:

- `out/index.html`
- `out/src/main.js`
- `out/src/engine.min.js` (runtime bundle)
- `out/assets/*` (costumes/sounds)

Open `out/index.html` in a browser.

## Development (Repo)

```bash
pnpm install
pnpm run build
pnpm --filter @scratch-compiler/cli run start
```

