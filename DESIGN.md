---
name: Front Step Sites
description: The shelf tag. Honest price, unit price, what's in the box, no fine print.
colors:
  ink: "#111312"
  ink-2: "#474d4b"
  ground: "#eceeec"
  tag: "#ffffff"
  tag-yellow: "#ffd60a"
  rail: "#a3aaa9"
  rail-deep: "#5d6563"
  line: "#cfd4d2"
  ok: "#1d7a45"
  ok-wash: "#eef7f1"
  pending: "#9a6700"
  danger: "#b3261e"
  ink-on-dark: "#f1f2f1"
  ink-2-on-dark: "#c8cdcb"
typography:
  numerals:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontWeight: 800
    fontStretch: "75%"
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  display:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.2rem, 5.5vw, 3.9rem)"
    fontWeight: 800
    fontStretch: "80%"
    lineHeight: 0.98
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Archivo, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: "0px"
  sm: "3px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "20px"
  lg: "40px"
  xl: "80px"
components:
  tag:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 18px"
  tag-ours:
    backgroundColor: "{colors.tag-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "18px 20px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.tag-yellow}"
    rounded: "{rounded.sm}"
    padding: "14px 20px"
  button-on-dark:
    backgroundColor: "{colors.tag-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 20px"
  button-secondary:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 18px"
---

# Front Step Sites design system

## Overview

The world is the retail shelf tag: the one object in a store that states the price, the unit price, and what you get, with nothing hidden. Every owner and every one of their customers reads them daily. It carries the pitch (cheaper than doing it yourself, and leaving costs nothing) as plain merchandise, not as marketing.

Marketing surfaces (the one-pager, the printable sheet) use it at full strength: shelf rails, tags, unit-price boxes, barcode dividers. The portal uses it quietly: a domain is a tag (name, renew date, status), and everything else is familiar form controls. Light surfaces only: owners read this in daylight on a phone or at a kitchen table at night, and tags are black on white.

Refuses: the SaaS builder landing page (gradient hero, device mockup, three icon cards, testimonial carousel), and cream-and-serif "artisanal" warmth.

## Colors

Restrained with one committed signal. `line` is the hairline rule, `pending` the in-between state (moving, awaiting), `ink-on-dark`/`ink-2-on-dark` the text on the one ink-black section. `ground` is the shelf (cool store-light gray), `tag` white carries content, `ink` carries all type. **`tag-yellow` means "ours": only Front Step's own offer tags and the primary action text use it.** Never yellow for decoration, warnings, or highlights. `rail`/`rail-deep` are the steel shelf channel. `ok` and `danger` exist for portal state only.

## Typography

One family: Archivo (variable width + weight). Tag numerals and display use the condensed widths (75–80%) at 800 weight, like printed shelf tags; body and UI stay at normal width. Labels are small bold caps with open tracking, used on tags and form labels only, never as an eyebrow over every section. Prices always show the unit: `/yr`, `/mo`, `one-time`.

## Layout

Marketing: content sits on a shelf. A tag row rests on a rail (a gray channel band with a darker lip). Tags align to the rail's top edge, not centered in boxes. Mobile stacks tags vertically on one continuous rail per tag. Max text measure 65ch. One spacing rhythm (6/12/20/40/80).

Portal: one column, max 760px, generous tap targets (48px min), no sidebars.

## Elevation & Depth

Tags are flat paper: a 1px ink border plus a short hard shadow straight down (`0 2px 0 rgba(0,0,0,.18)`) as if clipped to the rail. No blur halos, no glass. The rail has a lip: a 4px `rail-deep` bottom edge.

## Shapes

Square corners on tags (they're cut card stock). 3px radius on buttons and inputs only. A tag may carry a punched hole (small circle) or a barcode strip; no other ornament.

## Components

- **Tag:** label line (bold caps), one-line description, giant numeral + unit, unit-price box bottom-right (bordered inset), fine-print line for the source/date. Competitor tags always cite source and month.
- **Our tag:** same anatomy on `tag-yellow`, slightly larger. One per shelf.
- **Rail:** full-bleed band behind a tag row.
- **Barcode divider:** a thin SVG barcode strip between major sections, decorative only (`aria-hidden`).
- **Primary button:** ink background, yellow text. **On dark:** yellow background, ink text (only inside an ink section). **Secondary:** white with ink border.
- **Focus:** 3px ink outline (always 3:1+ contrast) with a yellow halo outside it. Never a yellow-only ring: yellow on white fails contrast.
- **Packing list:** a tag (punched hole, condensed price numeral with unit) whose body is a checklist; a row of them hangs on one rail.
- **Portal domain tag:** the domain name large, renew date as the "price line", status as the label line (`ok` dot for active). Actions are plain buttons below it.

## Scope

This system governs Front Step Sites' own surfaces: the one-pager, printables, and the portal. Customer demo and customer sites (e.g. the sample plumber at `/plumber/`) carry their own brand worlds and are not bound by these tokens.

## Do's and Don'ts

- Do state the unit on every price and the source + month on every competitor price.
- Do show the real mechanism (the portal's "Move my domain" button) instead of describing it.
- Don't use yellow for anything that isn't ours or the primary action.
- Don't invent testimonials, ratings, customer counts, or logos. None exist yet.
- Don't use em dashes in copy. Periods and commas.
- Don't round tag corners or put gradients on tags; a tag is paper. The steel rail's sheen is the only gradient.
