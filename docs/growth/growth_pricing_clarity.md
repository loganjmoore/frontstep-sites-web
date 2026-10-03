# Plan billing clarity

Status: implemented in source; local browser verified. Production checkout is unverified.

The homepage now states Grow replaces Launch rather than being charged on top. A semantic comparison table shows billed amount, 12-month totals and explicitly labeled monthly equivalents. It states yearly plans are billed in one payment, the $58 difference between yearly Grow and 12 monthly Grow payments, and exclusions for extra domains/custom work.

Price authority inspected 2026-10-02: existing portal HANDOFF.md, README.md and scripts/stripe-setup.mts. The setup script sells each plan as a single line item. This patch did not run that script or inspect/change live Stripe products.

The existing portal get-started route redirects specifically to PAYMENT_LINK_LAUNCH. The new CTA therefore says “Start Launch for $99/year”. It does not imply a plan chooser or introduce unsupported plan query parameters. Grow checkout routing remains a separate product task.

Local table is readable at 1280/390px without horizontal scrolling. Native table headers/caption expose billing units to assistive technology. Impeccable detector reports advisory incumbent type-ramp/color differences; new 1rem table text reuses existing 16px list/label sizing and existing tokens. Shelf-tag styling is preserved.

Next gate: reviewed deployment and public price/checkout reconciliation, then measure checkout abandonment and paid activation. There is no measured acquisition result yet.

Follow-up plan handoff: pricing now has explicit Launch, Grow monthly and Grow yearly actions with fixed plan parameters, plus existing-subscriber sign-in guidance. Requires the frontstep-portal plan-handoff branch first; the old route ignores plan parameters. Local rendered source choices reach the actual built new portal recovery with plan retained (origin-only preview rewrite), with keyboard/refresh/retry and390/320 no overflow. Plan-link static checks pass. Live link configuration/prices/mode, actual checkout/provisioning and upgrade behavior remain unverified. No Stripe calls or payment. Evidence: evidence/plan-handoff-mobile.png; portal docs/growth/plan-handoff.md.
