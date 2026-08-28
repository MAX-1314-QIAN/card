const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('settlement.css','utf8');
const game=fs.readFileSync('game.js','utf8');
const targetRules=fs.readFileSync('balance/target/run-template.js','utf8');

for(const id of ['result-victory-reward','result-victory-formula','result-victory-coins','result-hands-reward','result-hand-rate','result-hand-coins','result-discards-reward','result-discards','result-discard-rate','result-discard-coins','result-card-coins-reward','result-persona-coins-reward','result-persona-coins','result-coins-reward','result-current-coins','result-persona-reward'])assert.ok(html.includes(`id="${id}"`),`missing settlement breakdown UI: ${id}`);
for(const copy of ['节点胜利奖励','剩余出牌奖励','剩余弃牌奖励','卡牌效果奖励','人格属性奖励','本战获得金币','结算后持有'])assert.ok(html.includes(copy),`missing player-facing reward explanation: ${copy}`);
assert.match(targetRules,/perRemainingDiscard:1/,'remaining discards must have an explicit configured coin rate');
assert.match(game,/function battleCoinBreakdown\(\)/);
assert.match(game,/rewardTotal:victoryCoins\+handCoins\+discardCoins/);
assert.match(game,/cardCoins=cardGoldThisBattle,personaCoins=personaGoldThisBattle/,'card and persona coins must remain independently traceable');
assert.match(game,/PERSONA_GOLD_EARNED/,'persona coin gains must use their own behavior event');
assert.match(css,/\.coin-breakdown\{display:grid/,'coin sources must be presented as a vertical sequence');
assert.match(css,/@keyframes rewardLineIn/);
assert.match(css,/@keyframes rewardTotalIn/);
assert.match(css,/@keyframes rewardCoinFly/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/,'settlement motion must respect reduced-motion preferences');

console.log('settlement-ui-tests: explicit victory, action, card and persona coin sources, vertical flow and motion passed');
