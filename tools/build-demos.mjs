// Generates the trade demo pages (roofer, landscaper, cleaner, painter, hvac) from plumber/index.html.
// Run from web/: node tools/build-demos.mjs
// Edit plumber/index.html for layout or honesty rules, edit TRADES for copy, then re-run.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync("plumber/index.html", "utf8");

const board = (rows) =>
  '<ul class="board">\n' +
  rows.map(([h, p, price, unit]) =>
    `      <li><h3>${h}</h3><p>${p}</p><div class="price" data-price="${price}">${price}<small>${unit}</small></div></li>`
  ).join("\n") + "\n    </ul>";
const steps = (rows) =>
  "<ol>\n" + rows.map(([h, p]) => `      <li><h3>${h}</h3><p>${p}</p></li>`).join("\n") + "\n    </ol>";
const reviews = (rows) =>
  '<div class="grid">\n' + rows.map(([t, who]) =>
    `      <blockquote><div class="stars" aria-label="5 stars">★★★★★</div><p>"${t}"</p><cite>${who} <span>&middot; Google</span></cite></blockquote>`
  ).join("\n") + "\n    </div>";

const TRADES = {
  roofer: {
    noun: "roofer", word: "Roofing", title: "Roof repair and replacement", sampleFor: "roofer",
    desc: "Roof repair and replacement with a written price before the work. Sample site by Front Step Sites.",
    h1: "Roofs fixed. <br>Price in writing.",
    lede: "Leaks, storm damage, and full replacements in <span data-city>Rivertown</span> and nearby. Call or send a photo of the damage and get a written price before any work starts.",
    personal: "Roof leaks, storm damage, and replacements in {city}. Call or text a photo of the problem and get a price before any work starts.",
    callSmall: "Call for an estimate", promises: ["Licensed &amp; insured", "Written estimates", "Cleanup included"],
    sub: "Roof repair &middot; replacement",
    intro: "Real starting prices, so you're not guessing. We inspect the roof, put the exact price in writing, and you say yes before we start.",
    board: [
      ["Leak repair", "Flashing, vents, and worn spots. We find where the water is getting in.", "$350", "starting at"],
      ["Shingle repair after a storm", "Missing or lifted shingles replaced and sealed.", "$450", "starting at"],
      ["Roof inspection", "A written report on condition, with photos of any problems.", "$199", "flat fee"],
      ["Full roof replacement", "Tear-off, new underlayment and shingles, and cleanup.", "$9,500", "typical home"],
      ["Gutter repair and cleaning", "Clogs cleared, loose sections reattached, downspouts checked.", "$179", "starting at"],
    ],
    stepsRows: [["You call or text a photo", "Someone picks up, asks what you're seeing, and books an inspection."], ["You get the price in writing", "We look at the roof, show you what we found, and quote it. Nothing starts until you say yes."], ["Fixed, and cleaned up", "Tarps down, nails swept up with a magnet, debris hauled off."]],
    reviews: [["Storm took off a row of shingles on a Friday. They were out Monday and the written price matched the bill.", "Dana M."], ["They showed me photos of the damage before quoting. No pressure, no upsell.", "Carlos R."], ["New roof in two days and the yard was spotless. Would call again.", "Priya S."]],
    creds: ["Your license number goes here", "Your coverage goes here", "Your warranty terms go here"],
    sampleCreds: ["State roofing license #RC-000000", "$2M general liability", "Workmanship warranty, manufacturer warranty on shingles"],
    placeholder: "Water coming through the bedroom ceiling",
  },
  landscaper: {
    noun: "landscaper", word: "Landscaping", title: "Lawn care and landscaping", sampleFor: "landscaper",
    desc: "Lawn care, cleanups, and landscaping with the price up front. Sample site by Front Step Sites.",
    h1: "Lawns kept. <br>Yards sorted.",
    lede: "Mowing, cleanups, mulch, and planting in <span data-city>Rivertown</span> and nearby. Call or text a photo of the yard and get a price before any work starts.",
    personal: "Mowing, cleanups, mulch, and planting in {city}. Call or text a photo of your yard and get a price before any work starts.",
    callSmall: "Call for a quote", promises: ["Licensed &amp; insured", "Weekly or one-time", "Free quotes"],
    sub: "Lawn care &middot; landscaping",
    intro: "Real starting prices, so you're not guessing. We look at the yard, quote the job, and you say yes before we start.",
    board: [
      ["Weekly lawn mowing", "Mow, trim, edge, and blow off the walks. Same crew each week.", "$45", "per visit, typical lot"],
      ["Spring or fall cleanup", "Leaves, sticks, and beds cleared and hauled away.", "$250", "starting at"],
      ["Mulch installed", "Beds edged and fresh mulch spread, delivered and cleaned up.", "$85", "per cubic yard"],
      ["Shrub and hedge trimming", "Shaped, trimmed, and cleaned up. Priced by size.", "$120", "starting at"],
      ["Planting and new beds", "We design the bed with you, plant it, and mulch it.", "$400", "starting at"],
    ],
    stepsRows: [["You call or text a photo", "We ask what you want done and set a time to look at the yard."], ["You get the price first", "We walk the yard, explain the plan, and quote it. Nothing starts until you say yes."], ["Done, and swept up", "Clippings blown off the driveway, gates latched, debris hauled away."]],
    reviews: [["Yard looked awful after winter. Two days later it looked like a magazine. Fair price.", "Dana M."], ["Same crew every week and they always latch the gate. Small thing, big deal.", "Carlos R."], ["Gave me a quote on the spot and showed up when they said they would.", "Priya S."]],
    creds: ["Your license number goes here", "Your coverage goes here", "Your guarantee goes here"],
    sampleCreds: ["State landscape license #LC-000000", "$1M general liability", "Replant guarantee on new plantings"],
    placeholder: "Need weekly mowing and a spring cleanup",
  },
  cleaner: {
    noun: "cleaning company", word: "Cleaning", title: "House cleaning", sampleFor: "cleaning company",
    desc: "House cleaning with the price before you book. Sample site by Front Step Sites.",
    h1: "Homes cleaned. <br>Price first.",
    lede: "Regular cleaning, deep cleans, and move-out cleans in <span data-city>Rivertown</span> and nearby. Call or text, tell us about your home, and get a price before you book.",
    personal: "Regular, deep, and move-out cleaning in {city}. Call or text about your home and get a price before you book.",
    callSmall: "Call or text to book", promises: ["Bonded &amp; insured", "Your own supplies on request", "Free quotes"],
    sub: "House cleaning &middot; deep cleans",
    intro: "Real starting prices, so you're not guessing. Tell us the size of your home and we confirm the exact price before you book.",
    board: [
      ["Regular cleaning", "Kitchen, baths, floors, dusting, and trash. Weekly, every other week, or monthly.", "$130", "starting at"],
      ["Deep clean", "Baseboards, inside appliances, and the spots regular cleaning skips.", "$240", "starting at"],
      ["Move-in or move-out clean", "An empty home cleaned top to bottom for the walkthrough.", "$280", "starting at"],
      ["Inside the oven and fridge", "Added to any visit.", "$40", "each"],
      ["Office and small business", "After-hours cleaning on a schedule that suits you.", "$95", "per visit, starting at"],
    ],
    stepsRows: [["You call or text", "Tell us the size of your home and what you'd like done."], ["You get the price first", "We quote it and you pick a day. Nothing is booked until you say yes."], ["Cleaned, and checked", "We clean to a checklist and walk the home before we leave."]],
    reviews: [["They came in, cleaned for three hours, and the kitchen has never looked like this. Same price as quoted.", "Dana M."], ["Move-out clean got my full deposit back. Booked them again for the new place.", "Carlos R."], ["Same person every time and she remembers which rooms the dog sleeps in.", "Priya S."]],
    creds: ["Your insurance details go here", "Your bonding details go here", "Your guarantee goes here"],
    sampleCreds: ["$1M general liability", "Bonded", "Not happy, we come back and fix it"],
    credLabels: ["Insured", "Bonded", "Guarantee"],
    placeholder: "Three bedroom house, deep clean before guests arrive",
  },
  painter: {
    noun: "painter", word: "Painting", title: "Interior and exterior painting", sampleFor: "painter",
    desc: "Interior and exterior painting with a written price before the work. Sample site by Front Step Sites.",
    h1: "Walls painted. <br>Price in writing.",
    lede: "Interior rooms, exteriors, and cabinets in <span data-city>Rivertown</span> and nearby. Call or text a few photos and get a written price before any work starts.",
    personal: "Interior, exterior, and cabinet painting in {city}. Call or text a few photos and get a price before any work starts.",
    callSmall: "Call for an estimate", promises: ["Licensed &amp; insured", "Written estimates", "Cleanup included"],
    sub: "Interior &middot; exterior painting",
    intro: "Real starting prices, so you're not guessing. We measure, put the exact price in writing, and you say yes before we start.",
    board: [
      ["One room, walls and trim", "Patching, prep, and two coats. Furniture moved and covered.", "$450", "starting at"],
      ["Whole-house interior", "Every room, ceilings optional. Priced by square footage.", "$3,200", "starting at"],
      ["Exterior repaint", "Washed, scraped, primed where needed, and two coats.", "$3,800", "starting at"],
      ["Cabinet refinishing", "Doors and frames cleaned, sanded, primed, and sprayed.", "$1,800", "starting at"],
      ["Deck or fence stain", "Cleaned and stained so it lasts.", "$600", "starting at"],
    ],
    stepsRows: [["You call or text photos", "We ask what you want painted and book a time to measure."], ["You get the price in writing", "We walk the job, explain the prep, and quote it. Nothing starts until you say yes."], ["Painted, and cleaned up", "Floors covered, tape pulled, and a walkthrough with you before we leave."]],
    reviews: [["They patched every nail hole without me asking and the lines are razor sharp.", "Dana M."], ["The written price matched the final bill to the dollar.", "Carlos R."], ["Whole downstairs done in three days and not a drop on the floors.", "Priya S."]],
    creds: ["Your license number goes here", "Your coverage goes here", "Your warranty terms go here"],
    sampleCreds: ["State contractor license #PC-000000", "$1M general liability", "2 years on labor"],
    placeholder: "Living room and hallway, walls and trim",
  },
  hvac: {
    noun: "HVAC company", word: "Heating and cooling", title: "Heating and air conditioning repair", sampleFor: "HVAC company",
    desc: "Heating and air conditioning repair and installs with the price before the work. Sample site by Front Step Sites.",
    h1: "Comfort fixed. <br>Price first.",
    lede: "Furnace and AC repair, tune-ups, and new systems in <span data-city>Rivertown</span> and nearby. Call or text, describe the problem, and get a price before any work starts.",
    personal: "Furnace and AC repair, tune-ups, and new systems in {city}. Call or text, describe the problem, and get a price before any work starts.",
    callSmall: "Call now", promises: ["Licensed &amp; insured", "Same-day service", "Work guaranteed 1 year"],
    sub: "Heating &middot; cooling",
    intro: "Real starting prices, so you're not guessing. We confirm the exact price on site and you say yes before we start.",
    board: [
      ["AC or furnace repair", "We diagnose it, explain the fix, and quote the repair.", "$99", "diagnostic"],
      ["Seasonal tune-up", "Cleaned, tested, and checked so it doesn't quit on the coldest or hottest day.", "$119", "starting at"],
      ["Thermostat install", "Smart or standard, set up and tested.", "$179", "starting at"],
      ["New AC or furnace", "Sized for your home, installed, and old unit hauled away.", "$5,500", "starting at"],
      ["Duct cleaning", "Every vent cleaned and the system tested after.", "$349", "starting at"],
    ],
    stepsRows: [["You call or text", "Someone picks up, asks what the system is doing, and gives you an arrival window."], ["You get the price first", "We diagnose it, explain the fix in plain words, and quote it. Nothing starts until you say yes."], ["Fixed, and tested", "Shoe covers on, system tested while you watch, old parts hauled off."]],
    reviews: [["AC died in July. Someone answered, came that afternoon, and it was running by dinner.", "Dana M."], ["Explained what was wrong with the furnace and gave me two options. No pressure.", "Carlos R."], ["Tune-up took an hour and they actually showed me the filter. Fair price.", "Priya S."]],
    creds: ["Your license number goes here", "Your coverage goes here", "Your warranty terms go here"],
    sampleCreds: ["State HVAC license #HV-000000", "$2M general liability", "1 year on labor, manufacturer warranty on parts"],
    placeholder: "Furnace is blowing cold air",
  },
};

function must(s, re, to) {
  if (!re.test(s)) throw new Error("template marker missing: " + re);
  return s.replace(re, () => to);
}

for (const [slug, t] of Object.entries(TRADES)) {
  let s = src;
  s = must(s, /<title>[^<]*<\/title>/, `<title>Rivertown ${t.word} | ${t.title}</title>`);
  s = must(s, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${t.desc}">`);
  s = must(s, /<!--\nTHESIS[\s\S]*?-->/, `<!--\nTrade variant of ../plumber, generated by tools/build-demos.mjs. Do not edit by hand.\nPERSONALIZE: ?n=Business+Name&c=City&p=5551234567&since=1998&color=14532D (all optional; text only, escaped).\n-->`);
  s = must(s, /<h1 id="h1">[^<]*<br>[^<]*<\/h1>/, `<h1 id="h1">${t.h1}</h1>`);
  s = must(s, /<p class="lede"[\s\S]*?<\/p>/, `<p class="lede" data-personal="${t.personal}">${t.lede}</p>`);
  s = must(s, /<small data-personal="Call now">[^<]*<\/small>/, `<small data-personal="Call now">${t.callSmall}</small>`);
  s = must(s, /<div class="promises" data-sample-only>[\s\S]*?<\/div>/, `<div class="promises" data-sample-only>${t.promises.map((x) => `<span>${x}</span>`).join("")}</div>`);
  s = must(s, /<span data-sample-only>Licensed &amp; insured &middot; <\/span>/, `<span data-sample-only>${t.sub} &middot; </span>`);
  s = must(s, /for a made-up plumber/, `for a made-up ${t.noun}`);
  s = must(s, /<h2 id="prices-h">[^<]*<\/h2>\n\s*<p class="intro" data-personal="[^"]*">[^<]*<\/p>/, `<h2 id="prices-h">What it usually costs</h2>\n    <p class="intro" data-personal="Your real prices go here, so customers are not guessing. You say yes before any work starts.">${t.intro}</p>`);
  s = must(s, /<ul class="board">[\s\S]*?<\/ul>/, board(t.board));
  s = must(s, /<p class="board-note" data-sample-only>[^<]*<\/p>\n?/, "");
  s = must(s, /<ol>[\s\S]*?<\/ol>/, steps(t.stepsRows));
  s = must(s, /<div class="grid">[\s\S]*?<\/div>\n(?=\s*<span class="label">Example reviews)/, reviews(t.reviews) + "\n    ");
  const dd = t.sampleCreds;
  const labels = t.credLabels || ["License", "Insured", "Warranty"];
  s = must(s, /<dl>[\s\S]*?<\/dl>/, `<dl>\n        ${labels.map((l, i) => `<dt>${l}</dt><dd data-yours="${t.creds[i]}">${dd[i]}</dd>`).join("\n        ")}\n        <dt>Since</dt><dd data-since data-yours="The year you opened">2004</dd>\n      </dl>`);
  s = must(s, /placeholder="[^"]*"><\/textarea>/, `placeholder="${t.placeholder}"></textarea>`);
  s = must(s, /name \+ " \| Plumbing repair, a real plumber answers"/, `name + " | ${t.title}"`);
  s = must(s, /<h3>Licensed\. Insured\. Guaranteed\.<\/h3>|<h3 data-personal="Your credentials">[^<]*<\/h3>/, `<h3 data-personal="Your credentials">${slug === "cleaner" ? "Insured. Bonded. Guaranteed." : "Licensed. Insured. Guaranteed."}</h3>`);
  if (slug !== "hvac") {
    s = must(s, /\s*<div data-sample-only><span>Emergencies<\/span><b>24\/7<\/b><\/div>/, "");
    s = must(s, /\s*<p class="open" data-sample-only>[\s\S]*?<\/p>/, "");
  }
  if (slug === "cleaner") s = must(s, /Text us a photo of the problem/, "Text us about your home");
  mkdirSync(slug, { recursive: true });
  writeFileSync(`${slug}/index.html`, s);
  console.log("wrote", `${slug}/index.html`);
}
