# LGuardians frontend demo

This is a static prototype of the security review dashboard. Open `index.html` in a browser or serve this folder with a static HTTP server. No build step or dependency installation is required.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Header, app mount point, dialog, and script/style references |
| `styles.css` | Violet theme, Indigo defense styles, layouts, and motion |
| `demo-data.js` | Six agent definitions, sample issues, and in-memory UI state |
| `app.js` | Dashboard, workflow, detail views, rendering, and demo interactions |
| `assets/lguardians-logo.svg` | Header logo |
| `.kiro/steering/` | Project context for Kiro |

The Binbird artwork is temporarily represented by labeled `이미지` placeholders in `bird()` (`app.js`). The logo remains an external SVG. No Base64 artwork is embedded in source files.

## Backend handoff

The current UI uses `initial` sample issues and mutates `issues` in memory. Reloading the page resets them. Buttons such as review start, phase advance, approval, and feedback only change local demo state. There are no API calls, authentication, or real security actions.

To connect actual data, agree on an API contract first. Map backend issue fields into the UI model in `demo-data.js`, then replace local mutations in `app.js` with requests and server state refreshes. Keep the existing `ready`, `running`, `review`, and `done` UI states unless the team agrees on a mapping. Do not put keys or credentials in this public repository.
