const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Math,JSON,Map,Set,Array,Object,String,Number,Date};
context.globalThis=context;
vm.createContext(context);
const balance=loadBalance(context),whitelist=balance.aiPersonaWhitelist,handTypes=balance.target.scoringProfile.hands,generator=context.AiPersonaGenerator.create(whitelist),builder=context.AiPersonaCandidateBuilder.create(whitelist),factory=context.AiPersonaTemplateFactory.create(whitelist);

function rows(entries,total){return entries.map(([value,count])=>({id:String(value),value,count,share:count/total}))}
function snapshot(runtimeNodeId='N04'){
  const playCount=12,handRows=[{id:'pair',name:'对子',count:6,playShare:.5,scoreShare:.42},{id:'straight',name:'顺子',count:3,playShare:.25,scoreShare:.33},{id:'high_card',name:'高牌',count:3,playShare:.25,scoreShare:.25}],conditionSignals={submittedCounts:rows([[2,3],[3,3],[4,3],[5,3]],playCount),scoringCounts:rows([[1,3],[2,6],[5,3]],playCount),currentHandCounts:rows([[4,3],[6,5],[8,4]],playCount),discardedCounts:rows([[1,1],[2,2],[3,1]],4),normalQualityRate:1,rareQualityRate:0,straightRate:.25,flushRate:0,matchedRankStructureRate:.5,uniqueSuitAtLeast2Rate:.75,uniqueSuitAtLeast3Rate:.5,uniqueSuitAtLeast4Rate:.25,priorityAtLeast2Rate:.75,priorityAtLeast4Rate:.25,priorityAtLeast6Rate:0,priorityAtLeast9Rate:0,sameHandTypeStreakAtLeast2Rate:.3,differentFromPreviousHandRate:.7,firstUniqueHandTypeRate:.25,discardFollowUpRate:.25},window={battleCount:3,completedBattleCount:3,playCount,totalScore:3600,averageScore:300,maxScore:700,handTypes:handRows,dominantHandTypeId:'pair',secondaryHandTypeId:'straight',topTwoHandTypeIds:['pair','straight'],uniqueHandTypeCount:3,conditionSignals,actions:{discardActions:4},suits:[],rankBands:[],personas:[],dataQuality:{hasPerPlayCardGroups:true,hasCompleteActionOrder:true}};
  return{schemaVersion:1,id:`AI_BEHAVIOR_SNAPSHOT_V1:${runtimeNodeId}:GENERATOR_TEST`,runtimeNodeId,afterBattleNumber:runtimeNodeId==='N04'?3:runtimeNodeId==='N08'?6:9,windows:{cumulative:window,recent:JSON.parse(JSON.stringify(window))},activeBuild:{handTypeUpgrades:[]},confidence:{level:'MEDIUM'}};
}

const first=generator.assignDirection({runtimeNodeId:'N04',assignments:{},randomValue:.2});
assert.deepStrictEqual(Array.from([first.directionId,first.assignments.N04,first.assignments.N08]),['AI_DIRECTION_BRIDGE','AI_DIRECTION_BRIDGE','AI_DIRECTION_BREAK']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(generator.assignDirection({runtimeNodeId:'N04',assignments:first.assignments,randomValue:.9}))),{directionId:'AI_DIRECTION_BRIDGE',assignments:JSON.parse(JSON.stringify(first.assignments)),created:false},'已保存的方向不得因随机值变化而重抽');
assert.strictEqual(generator.assignDirection({runtimeNodeId:'N08',assignments:{N04:'AI_DIRECTION_BREAK'}}).directionId,'AI_DIRECTION_BRIDGE');
assert.strictEqual(generator.assignDirection({runtimeNodeId:'N12',assignments:{}}).directionId,'AI_DIRECTION_FOLLOW');

const sourceSnapshot=snapshot('N04'),raw=builder.build({snapshot:sourceSnapshot,directionId:first.directionId,handTypes,maxCandidates:24}),chosenId=raw.candidates[3].id;
const generated=generator.generate({snapshot:sourceSnapshot,directionId:first.directionId,handTypes,selectedCandidateId:chosenId,sequenceNumber:1,portrait:'assets/art/ai-persona-placeholder.png'});
assert.strictEqual(generated.ok,true);
assert.strictEqual(generated.kind,'GENERATED_PERSONA');
assert.strictEqual(generated.selectionSource,'AI_SELECTED');
assert.strictEqual(generated.selectedCandidateId,chosenId);
assert.strictEqual(generated.template.name,'AI人格001');
assert.strictEqual(generated.template.mainEffect.triggerText,generated.candidate.playerCopy.trigger);
assert.strictEqual(generated.template.subAffixRules.slotCount,2);
assert.strictEqual(generated.template.subAffixRules.poolIds.length,0,'第二、第三词条池未确认前只能保留锁定槽位');
assert.ok(!/顺势|桥接|破局/.test(JSON.stringify(generated.template.mainEffect)));
assert.strictEqual(generated.template.aiPersonaMeta.internalDirectionId,'AI_DIRECTION_BRIDGE');

let memory=context.PersonaRuntime.emptyState();
const runtime=context.PersonaRuntime.create({templates:[],stateStore:{get:()=>JSON.parse(JSON.stringify(memory)),set:value=>{memory=JSON.parse(JSON.stringify(value))}},now:()=>100,idFactory:()=> 'AI_INSTANCE_001'});
runtime.registerTemplate(generated.template);
const instance=runtime.createInstance(generated.template.id,{source:'AI_GENERATED',generatedAtNodeId:'N04'});
runtime.equipPersona(instance.instanceId,0);
assert.strictEqual(instance.runtimeState.growthStacks,0);
assert.strictEqual(instance.subAffixSlots.length,2);
assert.ok(instance.subAffixSlots.every(slot=>slot.unlocked===false));
assert.strictEqual(runtime.validateState(runtime.getState()),true);

const invalidSelection=generator.generate({snapshot:sourceSnapshot,directionId:first.directionId,handTypes,selectedCandidateId:'NOT_IN_LOCAL_POOL',sequenceNumber:2});
assert.strictEqual(invalidSelection.selectionSource,'LOCAL_FALLBACK');
assert.strictEqual(invalidSelection.reason,'INVALID_AI_SELECTION');
assert.strictEqual(invalidSelection.template.name,'AI人格002');

const blockingReferences=raw.candidates.map((candidate,index)=>({referenceId:`BLOCK_${index}`,scope:'EQUIPPED',template:factory.fromCandidate(candidate,{sequenceNumber:100+index})})),baseFallback=context.PERSONA_BALANCE_MANIFEST.basePersonas.templates[0],fallback=generator.generate({snapshot:sourceSnapshot,directionId:first.directionId,handTypes,references:blockingReferences,sequenceNumber:3,fallbackTemplates:[baseFallback]});
assert.strictEqual(fallback.kind,'LIBRARY_PERSONA');
assert.strictEqual(fallback.reason,'NO_DISTINCT_LOCAL_CANDIDATE');
assert.strictEqual(fallback.templateId,baseFallback.id);

vm.runInContext(fs.readFileSync('persona/persona-collection.js','utf8'),context,{filename:'persona/persona-collection.js'});
const stored=new Map(),collection=context.PersonaCollection.create({storage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},initialTemplates:[],now:()=>200}),carried=collection.carryOut({instance,template:generated.template,runTemplateId:'RUN_TEMPLATE_TARGET',nodeId:'TARGET_PERSONA_CARRY_OUT'});
assert.strictEqual(carried.ok,true);
assert.strictEqual(carried.record.templateSnapshot.aiPersonaMeta.mechanismFingerprint,generated.template.aiPersonaMeta.mechanismFingerprint);
assert.ok(!('runtimeState' in carried.record));
assert.ok(!('subAffixSlots' in carried.record));

for(const file of ['persona/ai/template-factory.js','persona/ai/generator.js']){const source=fs.readFileSync(file,'utf8');assert.ok(!/\b(document|querySelector|localStorage|runController|fetch)\b/.test(source),`${file} 必须保持为纯领域模块`)}
console.log('ai-persona-generator-tests: persisted directions, AI ID selection, local fallback, dynamic template, locked affixes and carry-out boundary passed');
