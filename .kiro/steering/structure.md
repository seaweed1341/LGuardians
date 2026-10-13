# Structure and integration points

- index.html: five-menu shell, dialogs and toast.
- demo-data.js: agents, 30 issues, two detailed patches, mutable issue state.
- app.js: reusable map, battle, round records and common UI functions.
- workflow.js: rendering/navigation, filters, queues, patch decisions and follow-up.
  This file owns the delegated event handler.
- styles.css: original components; workflow.css: new layout overrides.
- assets/: logo and external BinBird images. No Base64 embedding.

Script order: demo-data.js, app.js, assets/binbirds.js, workflow.js, all defer.
workflow.js supplies the initial render after the artwork binding is available.

Selection batch and security queue must remain separate. Do not duplicate issues
or include rejected/dismissed issues in Result Processing. Require impact
acknowledgement before approval. Real deployment must await successful backend
response before marking the patch done. See README for API replacement points.
