# Trade-specific homepage samples

2026-10-03 — local implementation verified; production rollout and paid conversion remain open.

The homepage sample form previously sent every owner to plumbing. Its native Trade select now opens one of the six existing samples: Plumbing, Roofing, Landscaping, Cleaning, Painting or HVAC. Business name remains required; town remains optional. Native validation and GET submission are retained, including keyboard Enter. Only the existing n/c parameters are sent. Without JavaScript the selector stays disabled, the form explicitly opens plumbing, and the other demo links remain available.

This branch incorporates main through b41f115 and reuses the already-pushed bdfa2f5 demo honesty/signup fix as 844ed07. Demo services are examples rather than verified business claims; demo enquiry forms do not send or store messages. Signup links point to the existing portal. This does not verify checkout or approve publishing.

Browser evidence used fictional Fixture Birch & Pine / Rivertown. Actual submissions reached all six correct routes with URL-encoded values, personalized names, demo disclosure and the existing signup destination. Enter with an empty optional town worked; the personalized demo survived reload. Required-name validation blocked empty submission. Browser Back restored fields inconsistently; no custom draft persistence is promised.

Rendered checks at 1280, 390 and 320px show the sample form fits with 48px controls and visible keyboard focus. The 320px check also exposed an existing 11px plan comparison overflow: grid children now shrink, and table text uses 14px below 360px, preserving whole words and all three plan totals. Final body width equals viewport width at 320px. Saved images are in ../growth-evidence/trade-sample-desktop.png, trade-sample-390.png, trade-sample-320.png and plan-comparison-320.png.

Existing plan-cost checks and git diff --check pass. The single manual Impeccable scan reports 34 type/color contract findings, predominantly incumbent values. The scoped 14px comparison-table exception is intentional for the verified 320px layout. The PRODUCT.md legacy schema is reported only; context cleanup is separate from this feature. Independent finish review and exact-commit CI are recorded in the portfolio ledger.

No ranking, search-demand, revenue or conversion uplift is claimed. This repairs the existing acquisition path and adds no accepted idea to the portfolio count.
