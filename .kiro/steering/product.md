# Product overview

LGuardians is a security review presentation prototype, not a working scanner.
Navigation: Home, Issue Board, Verification Selection, Security Verification,
Result Processing. The last menu is 결과처리, not 리뷰.

The board has 30 synthetic issues: 24 investigate and 6 quick Not a bug actions.
Only two issues have runnable demo detail. Selection filters issues, simulates
one-shot code exploration/testing, then registers eligible results in a separate
security verification queue. Users can cancel queued verification.

Preserve the existing battle view and round history. Completed rounds expose
patches and impact analysis, followed by human approval or rejection. Approval
simulates deployment. Only approved, deployed patches appear in Result
Processing for editable summary comments and applicable OSS reports.

No action sends to a real service. Default has one running issue and one awaiting
approval. Demo settings can reset both to incoming for a complete walkthrough.
