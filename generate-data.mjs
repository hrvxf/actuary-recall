import fs from 'node:fs';

const raw = fs.readFileSync('source-acronyms.md', 'utf8')
  .replaceAll('\u00a0', ' ')
  .replace(/^# Acronyms\s*/m, '')
  .replace(/^-\s*$/gm, '');

const blocks = raw.split(/\n\s*\n+/).map((block) => block.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
const cards = [];
let current = null;

for (const block of blocks) {
  const answer = block.match(/^\*\*([A-Z])\*\*\s*(.+)$/);
  if (answer && current) {
    current.points.push({ letter: answer[1], text: answer[2].replace(/\s+/g, ' ').trim() });
    continue;
  }

  const heading = block.replace(/\*\*/g, '').match(/^(.+?)\s+[–-]\s+(.+)$/);
  if (heading) {
    current = {
      id: `card-${cards.length + 1}`,
      topic: heading[1].trim(),
      acronym: heading[2].replace(/\s+/g, ' ').trim(),
      points: []
    };
    cards.push(current);
  }
}

const groups = [
  ['Regulation & environment', /environment|regulator/i],
  ['Investments & assets', /asset|invest|yield curve|property|cash/i],
  ['Models, data & assumptions', /model|data|assumption|selection/i],
  ['Products & contracts', /product|contract|expense/i],
  ['Risk & insurance', /risk|advice|underwriting|re insurance|project/i],
  ['Capital, provisions & disclosure', /provision|disclos|capital|surplus|benefit scheme/i]
];

for (const card of cards) {
  card.category = groups.find(([, pattern]) => pattern.test(card.topic))?.[0] ?? 'Other';
  card.review = /overtime|illuminated|re insurance|a over l|\bacc$|renumeration/i.test(card.points.map((p) => p.text).join(' '));
}

fs.writeFileSync('dist/data.json', JSON.stringify(cards, null, 2) + '\n');
console.log(`Generated ${cards.length} acronym cards with ${cards.reduce((sum, card) => sum + card.points.length, 0)} recall points.`);
