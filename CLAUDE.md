# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use **pnpm** as the package manager.

```bash
pnpm install          # Install dependencies
pnpm run build        # Compile TypeScript → dist/
pnpm start            # Run with tsx (no compile needed)
pnpm run dev          # Run with tsx watch (auto-reload on changes)
pnpm run format       # Format src/ with Prettier
pnpm run format:check # Check formatting without writing
npx oxlint .          # Lint (no lint script in package.json; call oxlint directly)
```

Run with a custom port:
```bash
pnpm start -- -p 8080
```

There are no tests in this project.

## Architecture

A small CLI tool that starts an ngrok tunnel and prints the public URL as a QR code in the terminal. Requires a valid ngrok authtoken (read from `NGROK_AUTHTOKEN` env var, ngrok's default config file, or prompted interactively on first run).

**Entry flow** (`src/index.ts`):
1. Parses `-p`/`--port` CLI arg (default 3000) — uses a manual arg parser, not yargs
2. Registers `SIGINT`/`SIGTERM` handlers to cleanly disconnect ngrok
3. Calls `startNgrok(port)` → `generateQR(url)`

**Services** (`src/services/`):
- `ngrok.ts`: Manages tunnel lifecycle. `startNgrok` handles authtoken discovery/prompting, kills any prior ngrok process, then calls `ngrok.connect`. Falls back to a nameless connect if the named tunnel fails. Module-level `ngrokStarted` flag tracks state.
- `qr.ts`: Thin wrapper around `qrcode` that prints a terminal QR code using `chalk` for colored output.

## Code Style

- **Prettier**: single quotes, 4-space indent, trailing commas, 80-char print width
- **Linter**: oxlint with plugins: `unicorn`, `typescript`, `oxc`, `import`, `promise`
- **TypeScript**: strict mode, ES2022 target, ESNext modules, `src/` → `dist/`
- Import paths in source use `.js` extensions (required for ESM output compatibility)
