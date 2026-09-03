const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Math,JSON,Map,Set,Array,Object,String,Number,Date};
context.globalThis=context;
vm.createContext(context);
const balance=loadBalance(context),whitelist=balance.aiPersonaWhitelist,handTypes=balance.target.scoringProfile.hands,builder=context.AiPersonaCandidateBuilder.create(whitelist),validator=context.AiPersonaCandidateValidator.create(whitelist),budget=context.AiPersonaValueBudget.create(whitelist);

function rows(entries){return entries.map(([value,count,total])=>({id:String(value),value,count,share:count/total}))}
function snapshot(runtimeNodeId,confidence='MEDIUM'){
  const handRows=[
    {id:'pair',name:'对子',count:8,playShare:.5,scoreShare:.38},
    {id:'straight',name:'顺子',count:4,playShare:.25,scoreShare:.34},
    {id:'high_card',name:'高牌',count:2,playShare:.125,scoreShare:.08},
    {id:'flush',name:'同花',count:2,playShare:.125,scoreShare:.2}
  ];
  const conditionSignals={
    submittedCounts:rows([[2,5,16],[3,4,16],[4,3,16],[5,4,16]]),
    scoringCounts:rows([[1,2,16],[2,7,16],[3,3,16],[5,4,16]]),
    currentHandCounts:rows([[3,2,16],[5,5,16],[7,9,16]]),
    discardedCounts:rows([[1,2,5],[2,2,5],[3,1,5]]),
    normalQualityRate:.875,rareQualityRate:.125,straightRate:.25,flushRate:.125,matchedRankStructureRate:.5,
    uniqueSuitAtLeast2Rate:.8,uniqueSuitAtLeast3Rate:.5,uniqueSuitAtLeast4Rate:.25,
    priorityAtLeast2Rate:.875,priorityAtLeast4Rate:.375,priorityAtLeast6Rate:.125,priorityAtLeast9Rate:0,
    sameHandTypeStreakAtLeast2Rate:.35,differentFromPreviousHandRate:.65,firstUniqueHandTypeRate:.25,discardFollowUpRate:.25
  };
  const window={battleCount:3,completedBattleCount:3,playCount:16,totalScore:6000,averageScore:375,maxScore:900,handTypes:handRows,dominantHandTypeId:'pair',secondaryHandTypeId:'straight',topTwoHandTypeIds:['pair','straight'],uniqueHandTypeCount:4,conditionSignals,actions:{discardActions:5},suits:[],rankBands:[],personas:[],dataQuality:{hasPerPlayCardGroups:true,hasCompleteActionOrder:true}};
  return{schemaVersion:1,id:`AI_BEHAVIOR_SNAPSHOT_V1:${runtimeNodeId}:TEST`,runtimeNodeId,afterBattleNumber:runtimeNodeId==='N04'?3:runtimeNodeId==='N08'?6:9,windows:{cumulative:window,recent:JSON.parse(JSON.stringify(window))},activeBuild:{handTypeUpgrades:[{id:'pair',level:2}]},confidence:{level:confidence}};
}

function assertPool(pool){
  assert.ok(pool.candidateCount>0);
  assert.ok(pool.candidateCount<=24);
  assert.ok(pool.totalLegalCombinationCount>=pool.candidateCount);
  assert.strictEqual(new Set(pool.candidates.map(item=>item.id)).size,pool.candidateCount);
  assert.strictEqual(new Set(pool.candidates.map(item=>item.mechanismFingerprint)).size,pool.candidateCount);
  for(const candidate of pool.candidates){
    const result=validator.validate(candidate);
    assert.strictEqual(result.valid,true,result.errors.join('\n'));
    assert.strictEqual(candidate.runtimeNodeId,pool.runtimeNodeId);
    assert.strictEqual(candidate.directionId,pool.directionId);
    assert.ok(candidate.runtimeTemplate.growthRules.length>=1);
    assert.ok(!JSON.stringify(candidate.runtimeTemplate).includes('valueSource'));
    assert.ok(!JSON.stringify(candidate.runtimeTemplate).includes('valuesSource'));
    assert.ok(!/[{}]/.test(candidate.playerCopy.summary));
    assert.ok(!/顺势|桥接|破局/.test(candidate.playerCopy.summary));
  }
}

const bridge=builder.build({snapshot:snapshot('N04'),directionId:'AI_DIRECTION_BRIDGE',handTypes});
const breaking=builder.build({snapshot:snapshot('N08'),directionId:'AI_DIRECTION_BREAK',handTypes});
const follow=builder.build({snapshot:snapshot('N12','HIGH'),directionId:'AI_DIRECTION_FOLLOW',handTypes});
assertPool(bridge);assertPool(breaking);assertPool(follow);

assert.ok(bridge.candidates.some(candidate=>candidate.runtimeTemplate.conditions.some(condition=>condition.type==='HAND_TYPE_IS'&&condition.value==='straight')),'桥接池应能把次要牌型解析成真实牌型 ID');
assert.ok(follow.candidates.some(candidate=>candidate.runtimeTemplate.conditions.some(condition=>condition.type==='HAND_TYPE_IS'&&condition.value==='pair')),'顺势池应围绕稳定主牌型生成候选');
for(const pool of [bridge,breaking,follow])for(const candidate of pool.candidates.filter(item=>item.components.mainEffectPartId==='AI_EFFECT_FINAL_MULTIPLIER'))assert.strictEqual(candidate.runtimeTemplate.effects[1].type,'ADD_XMULT_RATE','最终乘区的逐层成长必须映射为独立倍率增量');
assert.deepStrictEqual(builder.build({snapshot:snapshot('N04'),directionId:'AI_DIRECTION_BRIDGE',handTypes}),bridge,'相同行为输入必须产生稳定候选池');
assert.throws(()=>builder.build({snapshot:snapshot('N12'),directionId:'AI_DIRECTION_BREAK',handTypes}),/not allowed/);

const overBudget=budget.evaluate({runtimeNodeId:'N04',triggerFrequencyBandId:'AI_FREQ_VERY_HIGH',mainEffectPartId:'AI_EFFECT_CHIPS',baseStrengthTierId:'AI_VALUE_100',growthPartId:'AI_GROWTH_CORE_TRIGGER',growthStrengthTierId:'AI_VALUE_100',growthCap:5,observedTriggerRate:.9,observedGrowthRate:.9,confidence:'HIGH'});
assert.strictEqual(overBudget.valid,false);
assert.ok(overBudget.errors.includes('MATURE_BUDGET_EXCEEDED'));

const invalid=JSON.parse(JSON.stringify(bridge.candidates[0]));
invalid.runtimeTemplate.conditions[0].valueSource='BEHAVIOR_DOMINANT_HAND_TYPE';
assert.strictEqual(validator.validate(invalid).valid,false,'本地候选不得保留未解析的动态选择器');

for(const file of ['persona/ai/value-budget.js','persona/ai/candidate-validator.js','persona/ai/candidate-builder.js']){
  const source=fs.readFileSync(file,'utf8');
  assert.ok(!/\b(document|querySelector|localStorage|runController|fetch)\b/.test(source),`${file} 必须保持为纯领域模块`);
}

console.log('ai-persona-candidate-builder-tests: observed rates, direction fit, budgets, growth mapping, deterministic pools and local validation passed');
