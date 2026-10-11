# Project structure and integration points

- `index.html`: static shell, `#app`, `#dialog`, and `#toast`.
- `styles.css`: layout, components, state colors, responsive rules, and placeholder artwork styles.
- `demo-data.js`: `agents`, `initial`, `issues`, the active view/filters, and UI state names.
- `app.js`: `render()`, view builders (`dashboard()`, `workflow()`, `detail()`), `bird()`, and event handlers. `advance()` simulates a review phase change; button handlers simulate other mutations.
- `assets/`: independent visual files. Keep image bytes out of HTML and JavaScript.

For backend work, define the issue DTO and endpoint behavior with the backend team. Then centralize fetching and mutations instead of scattering requests through view builders. Existing actions must display loading and error states before removing sample data. Preserve human review as an explicit action; the prototype's buttons do not submit to a server today.

Use the HTML file as the runnable entry point. Do not assume a React/TSX app or convert frameworks solely for Kiro: source separation and small files already make this project readable.
