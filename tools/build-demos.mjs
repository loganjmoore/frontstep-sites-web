// Regenerate the trade previews from the shared plumbing layout. Run from web/.
// Prospects' services, prices, credentials and reviews are never inferred.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const src = readFileSync('plumber/index.html', 'utf8');
const TRADES = {
  "roofer": {
    "noun": "roofer",
    "word": "Roofing",
    "title": "Roof repair and replacement",
    "services": [
      "Leak repair",
      "Shingle repair after a storm",
      "Roof inspection",
      "Full roof replacement",
      "Gutter repair and cleaning"
    ]
  },
  "landscaper": {
    "noun": "landscaper",
    "word": "Landscaping",
    "title": "Lawn care and landscaping",
    "services": [
      "Weekly lawn mowing",
      "Spring or fall cleanup",
      "Mulch installed",
      "Shrub and hedge trimming",
      "Planting and new beds"
    ]
  },
  "cleaner": {
    "noun": "cleaning company",
    "word": "Cleaning",
    "title": "House cleaning",
    "services": [
      "Regular cleaning",
      "Deep clean",
      "Move-in or move-out clean",
      "Inside the oven and fridge",
      "Office and small business"
    ]
  },
  "painter": {
    "noun": "painter",
    "word": "Painting",
    "title": "Interior and exterior painting",
    "services": [
      "One room, walls and trim",
      "Whole-house interior",
      "Exterior repaint",
      "Cabinet refinishing",
      "Deck or fence stain"
    ]
  },
  "hvac": {
    "noun": "HVAC company",
    "word": "Heating and cooling",
    "title": "Heating and air conditioning repair",
    "services": [
      "AC or furnace repair",
      "Seasonal tune-up",
      "Thermostat install",
      "New AC or furnace",
      "Duct cleaning"
    ]
  }
};
function replace(source, pattern, value) {
  if (!pattern.test(source)) throw new Error('Missing template marker: ' + pattern);
  return source.replace(pattern, () => value);
}
for (const [slug, trade] of Object.entries(TRADES)) {
  let page = src;
  page = replace(page, /<title>[^<]*<\/title>/, '<title>Sample ' + trade.word + ' Site</title>');
  page = replace(page, /<h1 id="h1">[\s\S]*?<\/h1>/, '<h1 id="h1">' + trade.title + '. <br>Your website.</h1>');
  page = replace(page, /<p class="lede">[\s\S]*?<\/p>/, '<p class="lede">A sample layout for a ' + trade.noun + '. The service ideas below are examples to confirm with the owner before publishing.</p>');
  page = replace(page, /<ul class="board">[\s\S]*?<\/ul>/, '<ul class="board">' + trade.services.map(service => '<li><h3>' + service + '</h3><div class="price">Ask about pricing</div></li>').join('\n') + '</ul>');
  page = page.replaceAll('Sample Plumbing Site', 'Sample ' + trade.word + ' Site').replaceAll('Sample plumbing website', 'Sample ' + trade.word.toLowerCase() + ' website').replaceAll('showing a plumbing layout', 'showing a ' + trade.noun + ' layout').replaceAll('Water heater leaking in the garage', 'Example enquiry');
  mkdirSync(slug, { recursive: true });
  writeFileSync(slug + '/index.html', page);
  console.log('wrote ' + slug + '/index.html');
}
