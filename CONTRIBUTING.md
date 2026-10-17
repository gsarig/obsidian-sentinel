# Contributing to Sentinel

Thanks for your interest in contributing!

## Getting started

1. Fork and clone the repository into `<vault>/.obsidian/plugins/sentinel/` of a test vault.
2. Install dependencies and start the watch build:

```bash
npm install
npm run dev
```

3. Enable the plugin in Obsidian (**Settings -> Community plugins**) and reload after changes.

## Before opening a pull request

All three must pass:

```bash
npm run lint   # ESLint (eslint-plugin-obsidianmd + typescript-eslint)
npm test       # Vitest unit suite
npm run build  # typecheck + production bundle
```

There is also an end-to-end suite (`npm run test:e2e`) that drives a real Obsidian instance; CI runs it on every push and pull request. Run `npm run build` first when `src/` changed, since the suite loads the bundled `main.js`.

Please add or update tests alongside logic changes, keep user-facing strings in `src/labels.json`, and avoid Node/Electron APIs so the plugin keeps working on mobile. See `AGENTS.md` for the full project conventions; they apply to human contributors too.

## Reporting bugs and requesting features

Open a GitHub issue with reproduction steps (for bugs) or a short description of the use case (for features). For a trigger that doesn't fire, include the action's **Where**, **When** and **What** settings.

## Releasing (maintainer only)

Run `npm version <new-version>` (SemVer, no leading `v`), which bumps `manifest.json` and `package.json` and records the version in `versions.json`, then commits and tags it. Push the commit and the tag (`git push --follow-tags`). The release workflow builds the plugin, attests the release assets, and creates a draft GitHub release. A tag containing `beta` produces a draft prerelease with `manifest-beta.json` for BRAT testers.
