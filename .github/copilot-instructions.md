# Copilot review instructions

- Node 24 is the active Node.js LTS line (since October 2025). CI deliberately pins `node-version: "24.x"`; do not flag it as non-LTS.
- The `obsidian` npm package publishes API typings on its own version cadence; its version is not expected to match `manifest.json`'s `minAppVersion`. Do not flag the mismatch.
