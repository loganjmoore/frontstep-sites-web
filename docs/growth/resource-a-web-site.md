# Downloadable website starter

Work order 5458, target query `a web site`. The existing builder comparison article now provides a usable standalone HTML export instead of a planning-only widget. Customer contact becomes a phone/email link. No AI, publishing, hosting, forms, booking or payments are claimed. Answers remain on the page and in the downloaded file.

Verified first build, unchanged repeat build, changed business-name rebuild, invalid contact recovery and stale-export disabling. Replacing the sandboxed iframe on changed output fixes the blank repeat-render defect observed in the actual browser. Phone export read back from Downloads exactly matches fictional input; email link and hostile markup escaping tested.

Evidence: evidence/website-starter-desktop.jpg and evidence/website-starter-mobile.jpg.

Verification: node tools/build-blog.mjs regenerated 252 articles and 22 hubs without dead links; node --test tests/seo/*.test.mjs tests/posthog/*.test.mjs passed all 20 tests. CUA exercised desktop and 390px fictional inputs and real downloads. Source and raster hashes are checked independently by the existing worker verified_resources helper. Existing canonical routes and original publication dates are preserved.

Analytics: existing public consent-gated client captures CTA on submission, completion only after valid output, and download after file creation/initiation. No entered facts are transmitted. Localhost cannot prove durable provider ingestion; real usage and organic lift remain pending.
