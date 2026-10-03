# Annual website cost calculator

Status: implemented in source; local browser verified. Production and paying-customer outcomes remain unverified.

The homepage #plans section lets an owner enter their own monthly website spend. It annualizes the amount in integer cents and compares Launch ($99), Grow monthly (12 × $29 = $348) and Grow yearly ($290). It reports higher costs, lower costs and equality. It does not assume a competitor price, feature equivalence, increased leads or ROI.

The native number field rejects empty, negative, over-limit and non-cent inputs. Previous results hide as soon as the input changes. No email gate, storage, dependency, request endpoint or new analytics payload was added. Static plan totals and a no-JavaScript calculation instruction remain readable without the module.

Verification, 2026-10-02:
- `node tools/test-plan-cost.mjs`: decimal arithmetic, zero, equality, upper boundary and invalid values pass.
- Rendered browser: $36.50/month produces $438/year and $339/$90/$148 less; $0/month shows all three plans cost more; -1 triggers native validation. Editing hides the old answer before recomputation.
- Desktop 1280 and mobile 390: no horizontal overflow; input is at least 48px tall. Evidence in evidence/plan-cost-{desktop,mobile,mobile-results}.png.
- Added CI runs the same dependency-free check.

Next acceptance gate: deploy the reviewed commit, verify module delivery and calculator on the public homepage, then compare Launch checkout starts and paid activations for visitors using the tool. No current conversion improvement is claimed. Existing analytics can observe generic button/link activity where enabled; the visitor's entered spend must not be added to an event payload.
