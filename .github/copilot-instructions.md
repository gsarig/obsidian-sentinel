# Copilot instructions

## Project overview

Sentinel is an Obsidian community plugin (TypeScript, bundled with esbuild) that triggers actions (set a frontmatter property, run a command) when notes are opened, closed, or left. `AGENTS.md` is the authoritative contributor guide; review comments must be consistent with it.

## What to focus on

Review for **correctness, security, and reliability**, in that order.

- Correctness: bugs in the event-tracking state machine (`src/handlers/`), targeting logic (`shouldRunAction`), template parsing (`parseTemplate`)
- Security: this plugin makes no network calls by design; flag any that appear. Vault content must never leave the vault.
- Reliability: listener registration/cleanup so the plugin unloads without leaks; async races in `active-leaf-change` handling

## What to skip

- **Style**: indentation, quote style, naming conventions. Do not comment on them.
- **Configurability**: do not suggest making intentional hardcoded values configurable unless there is a concrete correctness or security reason.
- **Speculative edge cases**: only flag an edge case that is realistically reachable given the surrounding code.
- **Hedged suggestions** ("consider", "could", "might"): only raise them when they address a real defect.

## Known-intentional decisions (do not flag)

- **Node 24 in CI** is the active Node.js LTS line (since October 2025).
- **`obsidian` npm typings version does not match `manifest.json`'s `minAppVersion`**: the typings package publishes on its own cadence.
- **Top-level `cacheDir` in `wdio.conf.mts`** is the documented wdio-obsidian-service mechanism (its code reads `config.cacheDir`).
- **`{{increment:initial,step}}` applies the step on the first triggering visit** (first write is initial + step). Deliberate, README-documented, and pinned by unit and E2E tests.
- **E2E tests assert observed behavior.** Do not suggest loosening or altering a test to accommodate a code change; behavior changes are product decisions that must be flagged as such.

## Public API (breaking-change alert)

Flag any change to these explicitly:

- `manifest.json` `id` and registered command IDs
- The trigger-type names in `Action['when']` (`src/types/actions.d.ts`) and the action fields (`where`, `when`, `what`, `propertyName`, `propertyValue`, `skipExisting`, `commandId`): they persist in users' saved `data.json`, so renames silently break existing configurations
- Template variable syntax (`{{date}}`, `{{time}}`, `{{title}}`, `{{increment}}`)
