const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

const context={globalThis:null};context.globalThis=context;vm.createContext(context);loadBalance(context);
const config=context.BALANCE_V21;

assert.strictEqual(config.meta.version,'2.1');
assert.deepStrictEqual(Array.from(config.battle.targets),[950,1100,1250,1350,1500,1650,1750,1950,2150,2300,2500,2750,3200]);
assert.strictEqual(config.battle.baseHands,4);
assert.strictEqual(config.battle.baseDiscards,3);
assert.strictEqual(config.battle.startingHandSize,8);
assert.strictEqual(config.battle.maxSelection,5);
assert.strictEqual(config.battle.narrowTableMaxSelection,4);
assert.strictEqual(config.battle.personaSlots,4);
assert.strictEqual(config.handTypes.length,9);
assert.deepStrictEqual(Array.from(config.handTypes.map(item=>item.priority).sort((a,b)=>a-b)),[1,2,3,4,5,6,7,8,9]);
assert.strictEqual(new Set(config.handTypes.map(item=>item.id)).size,9);
assert.ok(config.handTypes.every(item=>item.name&&Number.isFinite(item.chips)&&Number.isFinite(item.mult)&&item.scoringRule));
assert.strictEqual(config.personas.length,8);
assert.strictEqual(new Set(config.personas.map(item=>item.id)).size,8);
assert.ok(config.personas.every(item=>item.triggerType&&item.effectType&&Number.isFinite(item.value)&&item.duration&&item.target));
assert.strictEqual(config.defaultPersonaLoadout.length,config.battle.personaSlots);
assert.strictEqual(config.bossRules.length,3,'冻结 Boss 回归池应保持三档测试数据');
assert.ok(config.bossRules.every(pool=>pool.length===3&&pool.every(item=>item.effectType&&Number.isFinite(item.value)&&item.duration&&item.target)));
assert.deepStrictEqual(Array.from(config.interventions.rewardProbability),[.5,.4,.3]);
assert.strictEqual(config.interventions.events.filter(item=>item.kind==='reward').length,3);
assert.strictEqual(config.interventions.events.filter(item=>item.kind==='penalty').length,3);
assert.ok(config.interventions.events.every(item=>item.effectType&&Number.isFinite(item.value)&&item.duration&&item.target));
assert.strictEqual(config.featureFlags.manualDeckTargetBoostEnabled,false);
assert.strictEqual(config.featureFlags.manualDeckTargetBoostValue,3);
const html=fs.readFileSync('index.html','utf8'),gameSource=fs.readFileSync('game.js','utf8');
assert.ok(/id="deck-target-mode"[^>]*debug-deck-target hidden/.test(html));
assert.ok(/function confirmDeckTarget\(\)[\s\S]*if\(!balance\.featureFlags\.manualDeckTargetBoostEnabled\)return;/.test(gameSource),'普通牌库强化仍受关闭的开发开关保护，商店目标选择走独立正式入口');
assert.strictEqual(config.shop.id,'TARGET_SHOP_V1');
assert.strictEqual(config.shop.items.length,68);
assert.ok(!/id="deck-detail-desc"[^>]*>[^<]*\+3/.test(html));

function assertNoFunctions(value,path='BALANCE_V21'){
  assert.notStrictEqual(typeof value,'function',`${path} 不应包含可执行函数`);
  if(value&&typeof value==='object')Object.entries(value).forEach(([key,child])=>assertNoFunctions(child,`${path}.${key}`));
}
assertNoFunctions(config);
console.log('balance-config-tests: all assertions passed');
