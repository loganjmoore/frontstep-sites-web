---
title: "How to move a domain to a new provider"
description: "Move your business domain with a clear plan for account access, transfer codes, locks, DNS, email, and website checks before canceling your old services."
slug: "how-to-move-a-domain-to-a-new-provider"
cluster: "guides"
answer: "To move a domain to a new registrar, confirm access and transfer eligibility, protect the existing website and email settings, unlock the domain, and use its authorization code at the new provider. A domain transfer does not move website files or mailboxes. Keep old services active until you have verified the transfer and every service that depends on the domain."
updated: "2026-09-26"
---

A domain transfer is the process of moving a domain's registration from one registrar to another. How do you do that without losing your website or email? First, find out which part you are actually moving: the domain registration, the website, the email service, or all three. They can share one bill, but they are different services and need separate checks.

## Decide whether you need a domain transfer at all

The registrar manages your domain registration and renewal. Your website host stores or serves the site. Your email provider runs the mailboxes. DNS is the set of directions that connects the domain to those services.

Changing website providers does not always require changing registrars. You may be able to leave the domain where it is and update the website's DNS records. Ask the new website provider which change is required before starting a transfer.

A registration transfer by itself does not copy your website, messages, booking system, or customer data. ICANN explains that domain registration and services such as hosting and email are separate in its [guide to domain names](https://www.icann.org/resources/pages/about-domain-names-2018-08-30-en).

Write down the intended outcome in plain language: "Keep the same domain and email, move the website, and change who renews the domain." The [plain-English hosting guide](/blog/what-website-hosting-is-in-plain-english/) can help you identify which company handles each part.

## Confirm ownership, account access, and timing

Sign into the account that controls the domain. Confirm that you can receive account messages and complete any security checks. A web designer's invoice is not the same as access to the registrar account.

Check the registered holder information and renewal date. If ownership or access is unclear, resolve it with the provider before planning the move. The [domain ownership guide](/blog/who-owns-your-domain-name-and-why-it-matters/) explains why the registered name and account control matter.

Check eligibility before changing registration contact details. ICANN describes possible 60-day restrictions after initial registration or a previous transfer, plus a 60-day lock after certain registrant changes. Some registrars offer an advance opt-out for the change-of-registrant lock; do not assume yours does. See [ICANN's transfer FAQ](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en).

Rules can differ by domain ending, particularly country-code domains, so ask both providers about your exact domain. If contact details are wrong, ask how to correct them and what that means for timing. Keep registration details accurate and allow for any resulting delay.

Do not leave the process until the final day before renewal. Ask what must remain active and what charges apply before proceeding, without assuming that a transfer cancels every old subscription.

## Save the settings that keep the business running

Before changing anything, record the current registrar, nameservers, DNS provider, website host, and email provider. Export the DNS records if possible, or ask your provider for a complete copy.

Nameservers identify where the domain's DNS directions are managed. Changing them can affect more than the website. Website records, email routing, verification records, and subdomains may all depend on the existing setup. [Cloudflare's DNS record guide](https://www.cloudflare.com/learning/dns/dns-records/) explains the main record types.

Ask the person handling the move to preserve:

- Website records, including the main domain and its www version.
- Email routing and email authentication records.
- Booking, portal, or other subdomain records.
- Verification records used by connected business tools.
- Any forwarding arrangements the business still uses.

Keep website and mailbox backups where appropriate, especially if those services are also moving. A list of DNS records is not a backup of the site or your messages.

If DNSSEC, a protection used with DNS, is enabled, ask the providers to coordinate it during the move. Do not guess at security settings while changing nameservers.

## Start the registrar transfer through the new provider

Once the preparation is complete, follow the destination registrar's instructions for your domain. The usual process for a domain such as a .com includes unlocking it for transfer and obtaining its authorization code from the current registrar.

The authorization code may also be called an Auth-Code, EPP code, or transfer code. Treat it like a sensitive account credential. Enter it through the new registrar's transfer process, not in a public message or shared project document.

Review and complete the required confirmations from the providers. A pending request is not a completed transfer, so check the status in the account rather than relying only on the first email. These steps are covered in [ICANN's transfer guidance](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en).

Ask whether the existing nameservers will stay in place and whether the old DNS service remains active after transfer. Do not assume either answer. If the destination requires a DNS change, prepare the replacement records before making the switch.

Keep a record of who is responsible for each step and how to reach support if a confirmation fails. You do not need to share your full account password with everyone involved.

## Test the website and email before canceling anything

After the transfer completes, confirm that the domain appears in the new account with the correct holder details, renewal settings, and contact information. Enable the account protections and domain lock appropriate to the new provider.

Then test the services separately:

1. Open the website with and without www.
2. Check that secure pages open without a certificate warning.
3. Visit important service pages and existing links.
4. Submit a contact form and confirm delivery.
5. Send email to and from an outside address.
6. Check booking pages, portals, and other subdomains.

If you changed DNS, different networks may temporarily use different cached information. Ask the provider to check the live records rather than assuming every failure will resolve by waiting.

Keep the old services until their replacements are verified and no remaining service depends on them. If the website is moving too, follow the [guide to switching website providers](/blog/how-to-switch-website-providers-without-losing-google-rankings/) for page addresses and redirects.

## Keep a simple handover record

Store the new registrar name, renewal date, account recovery method, and support route somewhere the business can access. Keep credentials in a secure password manager, not in the handover notes themselves.

Record which old subscriptions were canceled and which remain necessary. Email hosting or DNS may still be with the previous company even after the domain registration has moved.

If a former designer manages part of the setup, request the specific access or information you need. The [guide to leaving a web designer](/blog/how-to-leave-a-web-designer-and-keep-your-domain-and-site/) can help you organize that handover without confusing domain ownership with website files.

## Frequently asked questions

### Will my email addresses change when I transfer the domain?

They do not have to change. Keep the existing email service and required DNS records active, or arrange a separate mailbox migration. Test incoming and outgoing mail before canceling anything.

### Can I move my website while the domain is transfer-locked?

A registrar transfer lock does not necessarily prevent a website move. Ask whether you can update the relevant DNS records while keeping registration where it is. Your provider should confirm the options for your domain's current status.

### Does transferring the domain give me a new website?

No, the transfer changes who manages the domain registration. Website content, hosting, and any redesign need their own arrangements. Confirm exactly what the new provider is delivering.

## The short version

Separate the domain transfer from website and email moves, preserve the settings, and test every service before canceling old accounts. Keep ownership and renewal access under your control. With [Front Step Sites](/), the domain is registered in your own name, and you can leave and take it with no transfer fee.
