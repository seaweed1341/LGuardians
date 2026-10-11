# Technology and constraints

- Vanilla HTML, CSS, and browser JavaScript. No bundler or TSX configuration is present.
- `index.html` loads `styles.css`, `demo-data.js`, and `app.js` in that order. Both scripts use `defer`.
- This is a client-side prototype. `initial` is sample data; `issues` is mutable in-memory state. There is no API integration yet.
- Theme: Violet for primary UI, Indigo for defense. Attack keeps its red semantic color.
- Character artwork is temporarily a text placeholder returned by `bird()`. The header logo is `assets/lguardians-logo.svg`.
- Keep source files small and avoid embedding images as Base64. Put future images under `assets/` and reference paths instead.
- Never commit secrets, internal API keys, or actual customer data.
