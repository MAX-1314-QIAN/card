const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const context={console};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('deck-sort-runtime.js','utf8'),context,{filename:'deck-sort-runtime.js'});

const cards=[
  {uid:'heart-2',s:'♥',r:'2',ri:1},
  {uid:'spade-a',s:'♠',r:'A',ri:13},
  {uid:'diamond-a',s:'♦',r:'A',ri:13},
  {uid:'heart-k',s:'♥',r:'K',ri:12},
  {uid:'club-3-a',s:'♣',r:'3',ri:2},
  {uid:'club-3-b',s:'♣',r:'3',ri:2}
];
const sourceOrder=cards.map(card=>card.uid);

assert.deepStrictEqual(
  Array.from(context.DeckSortRuntime.sortCards(cards,'rank'),card=>card.uid),
  ['diamond-a','spade-a','heart-k','club-3-a','club-3-b','heart-2'],
  'rank sort must order high to low and use the shared suit order as a tie-breaker'
);
assert.deepStrictEqual(
  Array.from(context.DeckSortRuntime.sortCards(cards,'suit'),card=>card.uid),
  ['heart-k','heart-2','diamond-a','club-3-a','club-3-b','spade-a'],
  'suit sort must group suits and order ranks high to low inside each suit'
);
assert.deepStrictEqual(cards.map(card=>card.uid),sourceOrder,'display sorting must not mutate the source deck');
assert.deepStrictEqual(
  Array.from(context.DeckSortRuntime.sortCards(cards,'unknown'),card=>card.uid),
  ['diamond-a','spade-a','heart-k','club-3-a','club-3-b','heart-2'],
  'unknown modes must safely fall back to rank sorting'
);

const deckSortCss=fs.readFileSync('deck-sort.css','utf8');
const gameSource=fs.readFileSync('game.js','utf8');
assert.match(deckSortCss,/\.deck-dialog\[open\] \.deck-grid\s*\{[^}]*grid-auto-rows:max-content/s,'deck rows must keep their intrinsic card height');
assert.match(deckSortCss,/\.deck-dialog\[open\] \.deck-item\.has-card-art\s*\{[^}]*min-height:90px[^}]*aspect-ratio:744\/1039/s,'deck cards must retain the familiar portrait proportion');
assert.match(deckSortCss,/\.deck-dialog\[open\] \.deck-grid\s*\{[^}]*overflow-y:auto/s,'overflowing cards must scroll inside the unified dialog');
assert.match(gameSource,/upgradeStrip=cardPresentation\.upgradeStrip\(card\)/,'deck cards must reuse the battle card upgrade strip');
assert.doesNotMatch(gameSource,/\$\{summary\?`<em class="deck-card-upgrade-summary"/,'deck cards must not fall back to the truncated text summary');

console.log('deck-sort-tests: sorting and portrait deck layout safeguards passed');
