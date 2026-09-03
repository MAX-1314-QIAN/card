const assert=require('assert');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Math,JSON,Map,Set,Array,Object,String,Number,Date};
context.globalThis=context;
vm.createContext(context);
loadBalance(context);

const manifest=context.PERSONA_BALANCE_MANIFEST;
const whitelist=manifest.aiPersonaWhitelist;
const validator=context.PERSONA_BALANCE_MODULES.aiPersonaWhitelistValidator;

assert.strictEqual(whitelist.id,'TARGET_AI_PERSONA_WHITELIST_V1');
assert.strictEqual(whitelist.schemaVersion,1);
assert.strictEqual(whitelist.runtimeEnabled,false,'白名单完成不等于接入正式 AI 运行时');
assert.strictEqual(whitelist.decisionStatus,'UNDECIDED','触发率与预算没有遥测前不得伪装成正式确认值');
assert.strictEqual(manifest.target.aiPersonaWhitelist,whitelist);
assert.strictEqual(context.PERSONA_BALANCE_RUNTIME_CONFIG.aiPersonaWhitelist,whitelist);

assert.deepStrictEqual(
  Array.from(whitelist.nodePolicies.map(item=>[item.runtimeNodeId,item.afterBattleNumber])),
  [['N04',3],['N08',6],['N12',9]]
);
assert.ok(whitelist.nodePolicies.every(item=>item.playerFacing===false));
assert.ok(whitelist.nodePolicies.filter(item=>['N04','N08'].includes(item.runtimeNodeId)).every(item=>item.swapGroupId==='AI_DIRECTION_SWAP_EARLY'));
assert.strictEqual(whitelist.assemblyRules.directionAssignmentStateKey,'aiPersonaDirectionByNode');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(whitelist.nodePolicies.filter(item=>['N04','N08'].includes(item.runtimeNodeId)).map(item=>Array.from(item.directionIds).sort()))),
  [['AI_DIRECTION_BREAK','AI_DIRECTION_BRIDGE'],['AI_DIRECTION_BREAK','AI_DIRECTION_BRIDGE']]
);
assert.deepStrictEqual(Array.from(whitelist.nodePolicies.find(item=>item.runtimeNodeId==='N12').directionIds),['AI_DIRECTION_FOLLOW']);

assert.strictEqual(whitelist.triggerParts.length,20);
assert.ok(whitelist.triggerParts.reduce((sum,item)=>sum+item.variants.length,0)>=35);
assert.strictEqual(whitelist.mainEffectParts.length,4);
assert.strictEqual(whitelist.growthParts.length,6);
assert.strictEqual(whitelist.assemblyRules.requireGrowthPart,true);
assert.strictEqual(whitelist.assemblyRules.growthPartCount,1);
assert.strictEqual(whitelist.assemblyRules.growthEffectTypeByMainEffect.MULTIPLY_FINAL,'ADD_XMULT_RATE','最终乘区不得直接套用 valuePerStack 造成错误乘数');

const shopAnchor=manifest.shop.items.find(item=>item.id==='SHOP_SERVICE_006').effect.amountByAttributeType;
assert.deepStrictEqual(
  [whitelist.valueAnchor.units.ADD_CHIPS,whitelist.valueAnchor.units.ADD_MULT,whitelist.valueAnchor.units.ADD_XMULT_RATE],
  [shopAnchor.BASE_CHIPS,shopAnchor.BASE_MULT,shopAnchor.XMULT_RATE]
);
for(const tier of whitelist.strengthTiers){
  assert.ok(Math.abs(tier.values.ADD_CHIPS-tier.units*10)<1e-9);
  assert.ok(Math.abs(tier.values.ADD_MULT-tier.units*.3)<1e-9);
  assert.ok(Math.abs(tier.values.ADD_XMULT_RATE-tier.units*.1)<1e-9);
  assert.ok(Math.abs(tier.values.MULTIPLY_FINAL-(1+tier.units*.1))<1e-9);
}
assert.ok(whitelist.frequencyBands.every(item=>item.tuningStatus==='PROTOTYPE_ASSUMPTION'));
assert.ok(whitelist.numericBudgets.every(item=>item.tuningStatus==='PROTOTYPE_ASSUMPTION'));
assert.strictEqual(whitelist.affixPolicy.runtimeEnabled,true);
assert.strictEqual(whitelist.affixPolicy.candidatePoolStatus,'CONFIRMED');
assert.strictEqual(whitelist.affixPolicy.poolIds.length,6);
assert.deepStrictEqual(Array.from(whitelist.affixPolicy.slotPoolIds[0]),['AI_SUB2_CHIPS_050','AI_SUB2_MULT_050','AI_SUB2_XMULT_050']);
assert.deepStrictEqual(Array.from(whitelist.affixPolicy.slotPoolIds[1]),['AI_SUB3_CHIPS_100','AI_SUB3_MULT_100','AI_SUB3_XMULT_100']);
assert.strictEqual(whitelist.affixPolicy.disallowSameAttributeType,true);
assert.strictEqual(context.PERSONA_CONFIG_VALIDATOR.validate(manifest).valid,true);

function invalidAfter(change){
  const clone=JSON.parse(JSON.stringify(whitelist));
  change(clone);
  return validator.validate(clone,{
    conditionTypes:new Set(['SUBMITTED_CARD_COUNT_AT_LEAST','SUBMITTED_CARD_COUNT_AT_MOST','SUBMITTED_CARD_COUNT_EXACT','SCORING_CARD_COUNT_AT_LEAST','CURRENT_HAND_CARD_COUNT_BELOW','HAND_PRIORITY_AT_LEAST','HAND_QUALITY_IS','HAND_TYPE_IS','HAND_TYPE_IN','SAME_HAND_TYPE_STREAK_AT_LEAST','DIFFERENT_FROM_PREVIOUS_HAND','DISCARDED_CARD_COUNT_AT_LEAST','PERSONA_RUNTIME_FLAG','UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN','HAND_HAS_STRAIGHT','MIN_UNIQUE_SUITS','HAS_MATCHED_RANK_STRUCTURE','HAND_HAS_FLUSH']),
    runtimeEffectTypes:new Set(['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL','ADD_XMULT_RATE','ADD_COINS','ADD_HAND_LIMIT','ADD_DISCARD_LIMIT','SET_RUNTIME_FLAG','CLEAR_RUNTIME_FLAG','ADD_RUNTIME_COUNTER','ADD_GROWTH_STACK']),
    shop:manifest.shop,
    nodesById:new Map(manifest.stageNodes.map(item=>[item.id,item]))
  });
}

assert.strictEqual(invalidAfter(config=>{config.runtimeEnabled=true}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.directions[0].playerFacing=true}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.triggerParts[0].variants[0].conditions[0].type='FREE_TEXT_RULE'}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.strengthTiers[0].values.ADD_CHIPS=999}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.growthParts=[]}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.assemblyRules.aiMayReturnOnlyIds=false}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.nodePolicies[0].directionIds=['AI_DIRECTION_FOLLOW']}).valid,false);

console.log('ai-persona-whitelist-tests: legal parts, value anchor, hidden directions, dormant state and mutation guards passed');
