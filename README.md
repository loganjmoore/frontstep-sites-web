# Front Step Sites: public static pages

Deployed as a free Render static site (auto-deploys on push to `main`).

- `/` the Front Step Sites one-pager (design system: ../DESIGN.md in the private project)
- `/plumber/` sample plumber site, personalized with `?n=Name&c=Town&p=5551234567&color=14532d`
- `/link/` Logan's demo-link + outreach-message builder (noindex)

## Outreach demos

Trade previews: `/plumber/`, `/roofer/`, `/landscaper/`, `/cleaner/`, `/painter/`, `/hvac/`.
All are noindex examples, not customer sites. Only the supplied name, town,
phone and optional verified `since` year describe the business. Service lists
are explicitly examples to confirm; no reviews, licenses, hours or prices are
invented. Omit unknown details. The demo form sends nothing.

Build all variants after editing `plumber/index.html` or the trade service names:

```sh
node tools/build-demos.mjs
```

Fill the existing sales-kit CSV's `demo_link` column in one batch (100+ rows):

```sh
python3 tools/fill_demo_links.py /Users/loganmoore/code/website-biz/sales/kit/pipeline.csv --out /path/to/pipeline-with-demos.csv
```

Supply the actual path to `sales/kit/pipeline.csv`. Required columns are
`business,trade,city,phone,demo_link`; all other columns survive unchanged.
Supported trades: plumbing, roofing, landscaping, cleaning, painting, hvac.
Existing links are preserved unless `--force` is given. Unknown trades or empty
names are reported and skipped. Unknown phone numbers are omitted; years are
never inferred. Without `--out`, a `.bak` copy is saved before rewriting the input.
The original helper remains at `website-biz/sales/kit/fill_demo_links.py`.

The link builder produces drafts, not sent messages. Verify every public fact,
check the brand suppression list, and use the appropriate outreach channel.
