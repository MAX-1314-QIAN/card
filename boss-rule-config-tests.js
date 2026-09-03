const assert=require('assert');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Math,JSON,Map,Set,Array,Object,String,Number,Date};
context.globalThis=context;
vm.createContext(context);
loadBalance(context);

const manifest=context.PERSONA_BALANCE_MANIFEST;
const system=manifest.bossRuleSystem;
const stageLimits=manifest.stageLimits;
const binding=system.stageBindings[0];
const selection=system.selections.find(item=>item.id===binding.selectionId);
const pool=system.pools.find(item=>item.id===binding.poolId);
const bossNode=manifest.stageNodes.find(item=>item.id===binding.runtimeNodeId);
const finalProfile=stageLimits.profiles.find(item=>item.id==='TARGET_STAGE_LIMIT_FINAL');

assert.strictEqual(system.id,'TARGET_BOSS_RULE_SYSTEM_V1');
assert.strictEqual(system.schemaVersion,1);
assert.strictEqual(system.runtimeEnabled,false,'配置表不得自行恢复已删除的 Boss 运行系统');
assert.strictEqual(system.decisionStatus,'UNDECIDED');
assert.strictEqual(system.ruleSourceConfigId,stageLimits.id);

assert.deepStrictEqual(
  [binding.stageId,binding.runtimeNodeId,binding.stageOrder,binding.battleNumber,binding.stageType,binding.encounterId],
  ['STAGE_17','N17',17,13,'BOSS_BATTLE','TARGET_ENCOUNTER_FINAL']
);
assert.strictEqual(bossNode.finalBattle,true);
assert.strictEqual(bossNode.targetScore,3200);
assert.strictEqual(selection.mode,'WEIGHTED_SINGLE');
assert.strictEqual(selection.drawCount,1);
assert.strictEqual(selection.persistScope,'NODE_RUNTIME');
assert.strictEqual(selection.restorePolicy,'KEEP_SAVED_RESULT');

assert.strictEqual(pool.entries.length,6);
assert.deepStrictEqual(
  Array.from(pool.entries.map(entry=>entry.ruleId).sort()),
  Array.from(finalProfile.ruleIds).sort(),
  'Boss 池必须引用现有最终关安全池，不能复制另一份规则数值'
);
assert.ok(pool.entries.every(entry=>entry.weight===1&&entry.enabled===true));
assert.strictEqual(new Set(pool.entries.map(entry=>entry.ruleId)).size,6);
assert.ok(pool.entries.every(entry=>stageLimits.rules.find(rule=>rule.id===entry.ruleId)?.finalSafe===true));
assert.ok(pool.entries.every(entry=>!('effect' in entry)&&!('description' in entry)));
const totalWeight=pool.entries.reduce((sum,entry)=>sum+entry.weight,0);
assert.ok(pool.entries.every(entry=>entry.weight/totalWeight===1/6),'六条规则必须保持等权，每条原始概率为 1/6');

assert.strictEqual(manifest.target.bossRuleSystem,system);
assert.strictEqual(context.PERSONA_BALANCE_RUNTIME_CONFIG.bossRuleSystem,system);
assert.strictEqual(manifest.encounters.find(item=>item.id==='TARGET_ENCOUNTER_FINAL').bossProfileId,null,'未确认前不得把新配置接入旧 Boss Profile');
assert.strictEqual(context.PERSONA_CONFIG_VALIDATOR.validate(manifest).valid,true);

function invalidAfter(change){
  const clone=JSON.parse(JSON.stringify(manifest));
  change(clone);
  return context.PERSONA_CONFIG_VALIDATOR.validate(clone);
}
assert.strictEqual(invalidAfter(config=>{config.bossRuleSystem.runtimeEnabled=true}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.bossRuleSystem.pools[0].entries[0].ruleId='MISSING_RULE'}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.bossRuleSystem.pools[0].entries[0].weight=0}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.bossRuleSystem.pools[0].entries[0].effect={type:'TARGET_SCORE_DELTA',delta:100}}).valid,false);

console.log('boss-rule-config-tests: binding, references, weights, persistence contract and dormant state passed');
