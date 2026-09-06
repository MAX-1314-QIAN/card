const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Math,JSON,Map,Set,Array,Object,String,Number,Date};
context.globalThis=context;
vm.createContext(context);
const manifest=loadBalance(context),evaluator=context.PersonaConditionEvaluator,whitelist=manifest.aiPersonaWhitelist,handTypes=manifest.target.scoringProfile.hands;
const html=fs.readFileSync('index.html','utf8'),cacheVersion='20260906-diversity-v1';
for(const asset of ['ai-persona-whitelist-v1.js','ai-persona-whitelist-validator.js','schema-validation.js','persona-condition-evaluator.js','persona-runtime.js','run-controller.js','behavior-analytics.js','behavior-snapshot.js','candidate-validator.js','candidate-builder.js','similarity.js','template-factory.js','generator.js','score-runtime.js']){
  const line=html.split(/\r?\n/).find(entry=>entry.includes(asset));
  assert.ok(line?.includes(cacheVersion),`${asset} 必须刷新 AI 多样性版本缓存`);
}
assert.ok(html.includes('ai=20260906-diversity-v1'),'game.js 必须刷新 AI 多样性版本缓存');

const scoringCards=[
  {r:'2',ri:2,s:'♥'},
  {r:'4',ri:4,s:'♥'},
  {r:'6',ri:6,s:'♥'},
  {r:'8',ri:8,s:'♠'}
];
const conditionContext={scoringCards,scoringUniqueSuitCount:2,handPriority:4,previousHandPriority:2,remainingHands:1,remainingDiscards:2,handIndex:1};
assert.strictEqual(evaluator.evaluate({type:'SCORING_SUIT_COUNT_AT_LEAST',suit:'♥',value:3},conditionContext,{}),true);
assert.strictEqual(evaluator.evaluate({type:'SCORING_SUIT_COUNT_AT_LEAST',suit:'♠',value:2},conditionContext,{}),false);
assert.strictEqual(evaluator.evaluate({type:'ALL_SCORING_CARDS_IN_RANK_BAND',value:'low'},{scoringCards:scoringCards.slice(0,3)},{}),true);
assert.strictEqual(evaluator.evaluate({type:'ALL_SCORING_CARDS_IN_RANK_BAND',value:'low'},conditionContext,{}),false);
assert.strictEqual(evaluator.evaluate({type:'HAND_PRIORITY_HIGHER_THAN_PREVIOUS'},conditionContext,{}),true);
assert.strictEqual(evaluator.evaluate({type:'REMAINING_HANDS_EXACT',value:1},conditionContext,{}),true);
assert.strictEqual(evaluator.evaluate({type:'HAND_INDEX_EXACT',value:1},conditionContext,{}),true);
assert.strictEqual(evaluator.evaluate({type:'REMAINING_DISCARDS_AT_LEAST',value:2},conditionContext,{}),true);
assert.strictEqual(evaluator.evaluate({type:'MIN_SCORING_UNIQUE_SUITS',value:3},conditionContext,{}),false);

const progressionTemplate={id:'TEST_PRIORITY_PROGRESSION',name:'递进测试',qualityId:'TEST',conditions:[{type:'HAND_PRIORITY_HIGHER_THAN_PREVIOUS'}],effects:[{type:'ADD_CHIPS',value:20}],activationLimit:{scope:'HAND',count:1},growthRules:[],caps:{},runtimeDefaults:{activationCountThisBattle:0},runtimeScopes:{activationCountThisBattle:'BATTLE'}};
const runtime=context.PersonaRuntime.create({templates:[progressionTemplate],idFactory:()=> 'TEST_PRIORITY_INSTANCE'});
runtime.initializeRun([progressionTemplate.id]);
let result=runtime.evaluateHand({submittedCards:[{}],scoringCards:[{}],handTypeId:'high_card',handType:'高牌',handPriority:1},{commit:true,scoreLayers:{chips:10,mult:1,xmult:1}});
assert.strictEqual(result.chipsDelta,0,'没有上一手时不能触发牌型递进');
result=runtime.evaluateHand({submittedCards:[{}],scoringCards:[{}],handTypeId:'pair',handType:'对子',handPriority:2},{commit:false,scoreLayers:{chips:10,mult:1,xmult:1}});
assert.strictEqual(result.chipsDelta,20,'预览应读取上一手等级');
assert.strictEqual(runtime.getState().personaHistory.previousHandPriority,1,'预览不能修改上一手等级');
runtime.evaluateHand({submittedCards:[{}],scoringCards:[{}],handTypeId:'pair',handType:'对子',handPriority:2},{commit:true,scoreLayers:{chips:10,mult:1,xmult:1}});
assert.strictEqual(runtime.getState().personaHistory.previousHandPriority,2);
runtime.resetBattle();
assert.strictEqual(runtime.getState().personaHistory.previousHandPriority,null,'上一手等级必须跨战清空');

function rows(entries,total=12){return entries.map(([value,count])=>({id:String(value),value,count,share:count/total}))}
const signals={
  submittedCounts:rows([[2,6],[4,4],[5,2]]),scoringCounts:rows([[1,2],[2,6],[4,2],[5,2]]),currentHandCounts:rows([[4,3],[6,5],[8,4]]),handIndexCounts:rows([[1,3],[2,3],[3,3],[4,3]]),remainingHandCounts:rows([[1,3],[2,3],[3,3],[4,3]]),remainingDiscardCounts:rows([[0,1],[1,2],[2,4],[3,5]]),discardedCounts:rows([[1,1],[2,2],[3,1]],4),
  scoringSuitAtLeast3Rates:{'♠':.08,'♥':.42,'♦':.08,'♣':.08},allScoringRankBandRates:{low:.42,middle:.25,face:.17,ace:.08},normalQualityRate:.8,rareQualityRate:.2,straightRate:.25,flushRate:.17,matchedRankStructureRate:.58,uniqueSuitAtLeast2Rate:.75,uniqueSuitAtLeast3Rate:.5,uniqueSuitAtLeast4Rate:.25,scoringUniqueSuitAtLeast3Rate:.33,priorityAtLeast2Rate:.75,priorityAtLeast4Rate:.42,priorityAtLeast6Rate:.17,priorityAtLeast9Rate:.08,higherPriorityThanPreviousRate:.27,sameHandTypeStreakAtLeast2Rate:.25,differentFromPreviousHandRate:.65,firstUniqueHandTypeRate:.33,discardFollowUpRate:.25
};
const handRows=[{id:'pair',name:'对子',count:6,playShare:.5,scoreShare:.4},{id:'two_pair',name:'两对',count:3,playShare:.25,scoreShare:.3},{id:'straight',name:'顺子',count:3,playShare:.25,scoreShare:.3}];
const window={battleCount:3,completedBattleCount:3,playCount:12,totalScore:4000,averageScore:333,maxScore:800,handTypes:handRows,dominantHandTypeId:'pair',secondaryHandTypeId:'two_pair',topTwoHandTypeIds:['pair','two_pair'],uniqueHandTypeCount:3,conditionSignals:signals,actions:{discardActions:4,dominantSubmittedCardCount:2},suits:[{id:'♥',count:20,share:.5}],dominantSuitId:'♥',rankBands:[{id:'low',count:18,share:.45}],dominantRankBandId:'low',personas:[],dataQuality:{hasPerPlayCardGroups:true,hasCompleteActionOrder:true}};
const snapshot={schemaVersion:1,id:'AI_BEHAVIOR_SNAPSHOT_V1:N04:DIVERSITY',runtimeNodeId:'N04',afterBattleNumber:3,windows:{cumulative:window,recent:JSON.parse(JSON.stringify(window))},activeBuild:{handTypeUpgrades:[]},confidence:{level:'HIGH'}};
const builder=context.AiPersonaCandidateBuilder.create(whitelist),pool=builder.build({snapshot,directionId:'AI_DIRECTION_BRIDGE',handTypes,maxCandidates:96});
assert.strictEqual(pool.candidateCount,96,'扩大后的原始候选池应为查重补位保留空间');
const triggerIds=new Set(pool.candidates.map(item=>item.components.triggerPartId)),familyIds=new Set(pool.candidates.map(item=>item.mechanismFamilyId));
for(const id of ['AI_TRIGGER_DOMINANT_HAND_EXACT','AI_TRIGGER_SCORING_DOMINANT_SUIT_3','AI_TRIGGER_DOMINANT_RANK_BAND','AI_TRIGGER_PRIORITY_HIGHER_THAN_PREVIOUS','AI_TRIGGER_NO_DISCARD_THIS_BATTLE','AI_TRIGGER_FIRST_PLAY_THIS_BATTLE','AI_TRIGGER_REMAINING_DISCARDS_2','AI_TRIGGER_DOMINANT_HAND_AND_SUIT','AI_TRIGGER_SCORING_SUIT_DIVERSITY_3'])assert.ok(triggerIds.has(id),`候选池应覆盖 ${id}`);
assert.ok(familyIds.size>=5,'桥接候选应覆盖至少5个机制家族');

for(const candidate of pool.candidates){
  const main=candidate.runtimeTemplate.effects.find(effect=>['ADD_CHIPS','ADD_MULT','ADD_XMULT_RATE','MULTIPLY_FINAL'].includes(effect.type));
  const growth=candidate.runtimeTemplate.effects.find(effect=>effect.runtimeCounter==='growthStacks');
  if(main.type==='ADD_CHIPS')assert.strictEqual(Number.isInteger(main.value),true,'筹码主奖励必须为整数');
  if(main.type==='ADD_MULT')assert.strictEqual(Number.isInteger(main.value),true,'基础倍率主奖励必须为整数');
  if(main.type==='ADD_XMULT_RATE')assert.strictEqual(Number.isInteger(main.value*100),true,'独立倍率百分比必须为整数');
  if(growth?.type==='ADD_MULT')assert.strictEqual(Number.isInteger(growth.valuePerStack),true,'基础倍率成长必须为整数');
}

const similarity=context.AiPersonaSimilarity.filterPool(pool,{references:[],maxCandidates:12});
assert.strictEqual(similarity.candidates.length,12);
assert.ok(new Set(similarity.candidates.map(item=>item.mechanismFamilyId)).size>=5,'送给AI的12张候选必须保持机制家族覆盖');

const blockedTop=pool.candidates.slice(0,24).map((candidate,index)=>({referenceId:`BLOCK_TOP_${index}`,scope:'EQUIPPED',template:candidate})),prepared=context.AiPersonaGenerator.create(whitelist).prepare({snapshot,directionId:'AI_DIRECTION_BRIDGE',handTypes,references:blockedTop,maxCandidates:12});
assert.strictEqual(prepared.filtered.candidates.length,12,'前24个候选被查重排除后，必须从扩大池继续补足12个');
assert.ok(prepared.filtered.sourceCandidateCount>=96,'查重必须发生在扩大候选池上');

console.log('ai-persona-diversity-runtime-tests: new conditions, priority history, integer values, expanded pool and family coverage passed');
