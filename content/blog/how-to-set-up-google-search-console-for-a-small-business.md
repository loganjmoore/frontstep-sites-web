---
title: "How to set up Google Search Console"
description: "Set up Google Search Console, verify your business website, submit its sitemap, and learn which reports help you spot problems and useful searches."
slug: how-to-set-up-google-search-console-for-a-small-business
cluster: guides
answer: "Set up Google Search Console with a Google account your business controls, add your website, and verify ownership. Submit your sitemap, inspect your main pages, and review search performance over time. The tool helps you understand how your website appears in Google Search, but verification alone does not improve rankings or guarantee customers."
updated: 2026-09-26
---

You want to know whether Google can find your business website and which searches bring people to it. Google Search Console can help answer both questions. Start by connecting the site to an account you control, then focus on a few useful checks instead of every chart.

## Gather your logins before you start

Use a Google account that will stay with your business. Keep its recovery details current and turn on two-step verification. Your website provider can help with setup without becoming the only person who can access the account.

Have your website address and the login for the service managing your domain's DNS ready. DNS holds records that connect your domain to services such as your website and email. That service may be different from the company that builds your pages.

If a former designer holds these details, resolve access first. Our guide to [who owns your domain name](/blog/who-owns-your-domain-name-and-why-it-matters/) explains what to check. If someone already manages Search Console for you, ask them to give your business account access and help establish your own verified ownership.

## Choose the right website property

Open [Google Search Console](https://search.google.com/search-console/about), sign in, and add a website property. A property is simply the website, or part of a website, whose information you want to see.

You will encounter two main choices:

- **Domain property:** Covers your domain across versions such as www and non-www, including different protocols. It requires DNS verification for an ordinary business website.
- **URL-prefix property:** Covers addresses starting with the exact prefix you enter, including its https and www choices. It offers several verification methods.

For a business using its own domain, a Domain property is a practical starting point if you have DNS access. Enter the domain itself without https or a page path. If you use a URL-prefix property, copy the full homepage address after opening the live site.

[Google explains the property differences](https://support.google.com/webmasters/answer/34592?hl=en). Adding one gives you reporting access after verification; it does not move your website or boost its position in search.

## Verify ownership without disturbing your email

Follow the verification instructions Search Console provides. With a Domain property, that commonly means adding a TXT record to the DNS service that actually manages your domain.

1. Copy the verification value Google supplies.
2. Open the correct domain's DNS settings.
3. Add the requested record using your DNS provider's instructions for the name and value fields.
4. Save it, return to Search Console, and run verification.

Add the record rather than replacing unrelated records. Do not delete email records or change nameservers just to complete this step. If the screen is unfamiliar, give the verification record to your provider and ask them to add it.

A failed first attempt can mean the DNS change is not visible yet. Check the domain, record value, and provider before repeatedly changing things. Keep the verification record after success because Google checks it again later; its [ownership verification guide](https://support.google.com/webmasters/answer/9008080?hl=en) covers these details.

## Submit the sitemap your website actually uses

A sitemap is a file listing pages you want search engines to discover. Ask your provider for its exact address. A common filename is sitemap.xml, but your website may use another address or a sitemap index that points to several files.

Open that address in your browser first. You should reach the sitemap rather than a missing page or login screen. In Search Console, open the Sitemaps report and submit the address in the format the form requests.

Return later to check whether Google could read it. If there is an error, send your provider the sitemap address and the error message. A readable sitemap helps Google discover pages, but submission does not guarantee that every listed page will be indexed. [Google's Sitemaps report guide](https://support.google.com/webmasters/answer/7451001?hl=en) explains what the results mean.

## Check your important pages first

Start with your homepage, contact page, and the service pages you rely on for inquiries. For an electrician, that might include panel replacements and EV charger installation. A successful homepage check does not tell you whether those separate pages are available to Google.

Paste a page's full address into URL Inspection. Read the result, then use the live test if you need to check the current page. The stored result and the live test answer different questions, so a live page passing a test is not proof that it already appears in search.

After publishing or fixing a page, you can request indexing where available. That is a request, not a guarantee or a reason to keep clicking the same button. [Google's URL Inspection documentation](https://support.google.com/webmasters/answer/9012289?hl=en) explains those limits.

Use the broader Page indexing report when you need to investigate missing important pages. Some excluded addresses are expected, including duplicate versions and pages deliberately removed. [Google advises checking the reason](https://support.google.com/webmasters/answer/7440203?hl=en) rather than trying to make every URL indexed.

## Turn search reports into useful changes

The Performance report shows information such as clicks, impressions, queries, and pages. An impression means your site appeared in a search result under Google's reporting rules; a click records someone following a result to your site. Neither is a booked job. See [Google's Performance report guide](https://support.google.com/webmasters/answer/7576553?hl=en) for the definitions and reporting limits.

Look at meaningful periods rather than reacting to one quiet day. Separate searches for your business name from service searches when reviewing the query list. If people find your furnace repair page through questions about a furnace blowing cold air, check whether the page answers what they need before calling.

Use what you learn to [improve a service page](/blog/how-to-write-a-service-page-that-ranks-and-converts/), not to stuff the same phrase into every paragraph. Keep a simple dated note of important edits so later comparisons have context.

Check search information alongside actual inquiries. Our guide to [telling whether your website gets customers](/blog/how-to-tell-if-your-website-is-getting-you-customers/) connects the reporting to calls and forms. If you change website providers, make Search Console access part of your [website move checklist](/blog/how-to-switch-website-providers-without-losing-google-rankings/).

## Frequently asked questions

### Is Search Console the same as Google Business Profile?

No. Search Console helps you understand your website's presence in Google Search, while Business Profile manages your business listing information. Setting up one does not complete the other.

### Do I need Google Analytics first?

No. You can verify a Domain property through DNS without installing Analytics. Choose a verification method your business can maintain rather than adding another tool solely for this task.

### Why is there little or no data after setup?

New reporting may take time to populate, and a small site may receive few searches. Confirm you selected the correct property and inspect important pages before assuming something is broken. Review again after data has had time to accumulate.

### Does verification put my website at the top of Google?

No. Verification proves access and allows you to use the reports. Clear pages and a working website still matter, and no setup step guarantees a particular ranking.

## The short version

Keep Search Console under your business's control, verify ownership, and submit the correct sitemap. Check your key pages and use search reports to choose useful improvements. Compare the numbers with real customer inquiries before judging results. [Front Step Sites](/) includes local SEO setup with its $99-a-year website, with the domain included and no setup fee.
