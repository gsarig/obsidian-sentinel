# Sentinel: agent guide

Instructions for any AI agent working on this repository. Sentinel is an Obsidian community plugin that triggers actions (set a property, run a command) based on document visibility changes.

## Project overview

- **Language:** TypeScript, bundled to `main.js` with esbuild.
- **Entry point:** `src/main.ts` (the `Sentinel` plugin class). Compiled to `main.js` at the plugin root and loaded by Obsidian.
- **Release artifacts:** `main.js`, `manifest.json`, `styles.css`. Never commit `main.js` (it is gitignored and attached to GitHub releases instead).
- **Mobile:** `isDesktopOnly` is `false`. Avoid Node and Electron APIs so the plugin keeps working on mobile.

## Architecture

The runtime flow, following the code:

1. `src/main.ts` -> `onload()` loads settings and calls `actionManager(app, settings)`.
2. `src/handlers/actionManager.ts` calls `eventTracker`, and for each fired event filters the user's configured actions by trigger type, checks targeting with `shouldRunAction`, then runs `updateProperty` or `executeCommand`.
3. `src/handlers/eventTracker.ts` registers `active-leaf-change` and `layout-change` workspace listeners and tracks per-file state (opened files, ever-opened files, last active leaf).
4. `src/handlers/leafChangeHandler.ts` translates raw leaf and layout changes into the plugin's trigger types.

**Trigger types** (`Action['when']` in `src/types/actions.d.ts`): `everyOpen`, `firstOpen`, `firstOpenWithReset`, `everyClose`, `everyLeave`, `firstLeave`, `leaveChanged`, `leaveChangedNoFrontmatter`. These map to the "When" options documented in `README.md`.

**Key modules:**

| Area | Files |
|---|---|
| Targeting ("Where") | `src/utils/shouldRunAction.ts` (tags, folders, exact name, regex, `!` negation, comma combinations) |
| Template variables | `src/utils/parseTemplate.ts` (`{{date}}`, `{{time}}`, `{{title}}`, `{{increment}}`) |
| Actions ("What") | `src/actions/updateProperty.ts`, `src/actions/incrementProperty.ts`, `src/actions/executeCommand.ts` |
| Settings UI | `src/settings/` |
| User-facing strings | `src/labels.json` (read via `src/utils/getLabel.ts`; never hardcode strings) |

## Environment and tooling

- **Node:** current LTS (18+).
- **Package manager:** npm.
- **Bundler:** esbuild (`esbuild.config.mjs`).

```bash
npm install       # install deps
npm run dev       # watch build into the plugin folder
npm run build     # tsc typecheck + production bundle
npm test          # run the Vitest unit suite
npm run test:e2e  # run the wdio end-to-end suite (drives a real Obsidian)
```

## Testing

Two layers. Run both before pushing.

1. **Unit tests (`npm test`, Vitest).** Cover the pure logic where regressions actually happen: targeting rules, template parsing, frontmatter stripping, label substitution. The `obsidian` module is aliased to `test/mocks/obsidian.ts` (a `Notice` stub plus real `moment`), so tests run without Obsidian. When you change targeting or template behaviour, add or update a test in the same commit.
2. **E2E tests (`npm run test:e2e`, wdio-obsidian-service).** Drive a real sandboxed Obsidian against the fixture vault in `test/vaults/simple/`: every trigger type, targeting modes, actions, the settings UI, and regression tests. Rebuild (`npm run build`) first when `src/` changed, since the suite loads the bundled `main.js`.

For manual checks beyond the suites, build into a dev vault, reload Obsidian, and exercise the affected triggers directly.

## Manifest rules (`manifest.json`)

- Never change `id` after release. Treat it as a stable API.
- Keep `minAppVersion` accurate when using newer Obsidian APIs.
- Bump `version` (SemVer, no leading `v`) and update `versions.json` (plugin version -> minimum app version) together.
- `manifest-beta.json` tracks the current beta build for BRAT testers.

## Releasing

Tagging a commit triggers `.github/workflows/release.yml`, which builds and creates a draft release. A tag containing `beta` produces a draft prerelease with `manifest-beta.json`; otherwise a draft release with `manifest.json`. Tags carry no leading `v`. The release is created as a draft for manual review before publishing.

## Obsidian policies (must follow)

- **Local first, no telemetry.** Default to offline. Do not add network calls without an obvious user-facing reason, clear documentation, and opt-in. Never transmit vault contents.
- **Clean up listeners.** Register and remove every workspace, DOM, and interval listener so the plugin unloads without leaks. Prefer the `register*` helpers (`registerEvent`, `registerDomEvent`, `registerInterval`).
- **Scope.** Read and write only what the feature needs inside the vault.

## UI copy

- Sentence case for headings, buttons, settings.
- Bold for literal UI labels; arrow notation for navigation (**Settings -> Community plugins**).
- Keep strings in `src/labels.json`, not inline.

## Coding conventions

- TypeScript strict where practical; keep `main.ts` limited to lifecycle.
- Split files by responsibility; keep modules small.
- Prefer `async/await`; handle errors and surface them via `Notice` with a `labels.json` string.
- Bundle everything into `main.js`; no unbundled runtime dependencies.

## Do / don't

**Do:** add tests alongside logic changes; use stable command and action IDs; validate settings input; keep listeners cleaned up.

**Don't:** commit `main.js`; add network calls without disclosure; change `manifest.json` `id`; run auto-fixers on lint findings (report them instead).

## References

- Sample plugin: https://github.com/obsidianmd/obsidian-sample-plugin
- API docs: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
