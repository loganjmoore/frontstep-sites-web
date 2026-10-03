# Front Step Sites marketing site

This repository owns the public static marketing site and trade demos. The customer portal and billing implementation live in the separate FrontStep portal repository.

The buyer is a small-business owner in the US who wants a website built and maintained without learning a builder. The primary action opens the existing Launch checkout route at `https://app.frontstepsites.com/get-started`.

Launch is $99/year with hosting and one domain, 2 change requests per month and 2-business-day turnaround. Grow replaces Launch and includes its features with unlimited requests, same-business-day turnaround and Google reviews on the site. Grow is $29/month or $290/year. Extra domains and custom features are separate. Source authority: the existing project PRODUCT.md, portal HANDOFF.md and portal/scripts/stripe-setup.mts, inspected 2026-10-02. Live Stripe prices and payment delivery were not checked in this patch.

Keep the incumbent shelf-tag design in DESIGN.md. Use plain language, explicit billing units and large mobile controls. Do not invent testimonials, customers, rankings, savings assumptions or revenue forecasts. The calculator compares the visitor's own costs and makes no feature-equivalence claim. It must show higher costs just as clearly as lower costs.

Verification uses a local static preview with fictional input. No live checkout, payment or outreach is required to test this repository.
