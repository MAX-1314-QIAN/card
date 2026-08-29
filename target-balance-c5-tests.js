const assert=require('assert');
const fs=require('fs');
const simulator=require('./target-balance-simulator');

const first=simulator.simulateRun({policy:'GREEDY_SCORE',seed:13579,runIndex:0});
const second=simulator.simulateRun({policy:'GREEDY_SCORE',seed:13579,runIndex:0});
assert.deepStrictEqual(first,second,'固定 Seed 必须得到完全一致的 Target Run');

assert.strictEqual(simulator.pokerEngine,simulator.rules.PokerEngine,'模拟器必须使用正式 PokerEngine');
const straightCards=simulator.pokerEngine.createStandardDeck().filter(card=>card.s==='♠'&&['10','J','Q','K','A'].includes(card.r));
const royalResult=simulator.pokerEngine.evaluate(straightCards,simulator.targetHandProfile.hands,5);
assert.strictEqual(royalResult.typeId,'royal_flush');
assert.strictEqual(royalResult.scoringCards.length,4,'皇家同花顺按最新配置只计算四张牌的牌面筹码');

assert(simulator.rules.PersonaRuntime?.create,'模拟器必须加载正式 Persona Runtime');
assert.strictEqual(simulator.targetHandProfile.id,'POKER_HAND_PROFILE_TARGET_V1','模拟器必须读取正式 Target Scoring Profile');
assert.strictEqual(simulator.targetHandProfile.hands.length,11,'正式 Target 计分表必须包含十一种牌型');
assert.strictEqual(simulator.battleNodes.length,10,'完整 Target Run 必须批量运行十场战斗');
assert.strictEqual(simulator.battleNodes.find(node=>node.id==='N11').targetScore,2150,'正式 N11 目标分必须为2150');
const archive=simulator.manifest.personaTemplates.templates.find(item=>item.id==='TARGET_PROTO_GROWTH_ARCHIVE');
assert.deepStrictEqual(Array.from(archive.effects.map(effect=>[effect.type,effect.value??null,effect.valuePerStack??null])),[['ADD_MULT',.4,null],['ADD_MULT',null,.25]],'牌型档案生长体必须同时提供立即倍率和每层倍率');
assert.strictEqual(archive.caps.growthStacks,4,'牌型档案生长体最多成长4层');

const source=fs.readFileSync('target-balance-simulator.js','utf8');
assert(!source.includes('localStorage')&&!source.includes('runSave'),'无界面模拟不得读写正式存档');

const batch=simulator.runSimulation({runsPerPolicy:2,seed:24680});
assert.strictEqual(batch.meta.totalRuns,4);
assert.strictEqual(batch.summaries.GREEDY_SCORE.runCount,2);
assert.strictEqual(batch.summaries.PERSONA_AWARE.runCount,2);
assert.ok(Object.values(batch.handTypes).every(item=>Number.isFinite(item.targetSingleHandScore)&&item.targetSingleHandScore>0),'模拟审计必须为新牌型表提供有效基础分锚点');
const overridden=simulator.runSimulation({runsPerPolicy:1,seed:24680,targetOverrides:{N01:900}});
assert.strictEqual(overridden.summaries.GREEDY_SCORE.nodeStats.N01.targetScore,900,'参数扫描只应在模拟结果中覆盖指定节点');
assert.strictEqual(simulator.battleNodes.find(node=>node.id==='N11').targetScore,2150,'临时覆盖不得回写正式配置');

const growthImpact=simulator.verifyGrowthImpact();
assert(growthImpact.changed&&growthImpact.after>growthImpact.before,'Growth 人格必须确实改变后续正式得分');

console.log('target-balance-c5-tests: seed, formal poker/persona/scoring, no-save batch run and growth impact passed');
