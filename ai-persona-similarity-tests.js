const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Math,JSON,Map,Set,Array,Object,String,Number,Date};
context.globalThis=context;
vm.createContext(context);
loadBalance(context);
const similarity=context.AiPersonaSimilarity;

function candidate(id,{condition={type:'SCORING_CARD_COUNT_AT_LEAST',value:4},effect='ADD_CHIPS',growthEvent='HAND_COMMITTED',growthCondition={type:'UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN'},tags=['SCORING_CARD_COUNT','EFFECT_BASE_CHIPS'],fingerprint=`FP_${id}`,rankScore=50}={}){
  return{id,mechanismFingerprint:fingerprint,rankScore,behaviorTags:tags,runtimeTemplate:{conditions:[condition],effects:[{type:effect,value:15},{type:effect,valuePerStack:5,runtimeCounter:'growthStacks'}],growthRules:[{event:growthEvent,conditions:[growthCondition],effects:[{type:'ADD_GROWTH_STACK',value:1,runtimeCounter:'growthStacks'}] }]}};
}
function templateFrom(source,{fingerprint=source.mechanismFingerprint}={}){return{id:`T_${source.id}`,conditions:source.runtimeTemplate.conditions,effects:source.runtimeTemplate.effects,growthRules:source.runtimeTemplate.growthRules,tags:source.behaviorTags,aiPersonaMeta:{mechanismFingerprint:fingerprint,behaviorTags:source.behaviorTags}}}

const exact=candidate('AI_CANDIDATE_V1_EXACT'),near=candidate('AI_CANDIDATE_V1_NEAR',{fingerprint:'FP_NEAR',rankScore:49}),distinct=candidate('AI_CANDIDATE_V1_DISTINCT',{condition:{type:'HAND_HAS_FLUSH'},effect:'ADD_MULT',growthEvent:'DISCARD_COMMITTED',growthCondition:{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:2},tags:['FLUSH','EFFECT_BASE_MULT'],fingerprint:'FP_DISTINCT',rankScore:48});
const pool={runtimeNodeId:'N04',directionId:'AI_DIRECTION_BRIDGE',candidates:[exact,near,distinct]};
const references=[{referenceId:'EQUIPPED_1',scope:'EQUIPPED',template:templateFrom(exact),runsSinceLastUsed:0}];
const result=similarity.filterPool(pool,{references,maxCandidates:12});
assert.strictEqual(result.sourceCandidateCount,3);
assert.strictEqual(result.rejectedCount,2,'完全相同与仅数值档位不同的近似人格都应被当前装备挡住');
assert.deepStrictEqual(Array.from(result.candidates.map(item=>item.id)),['AI_CANDIDATE_V1_DISTINCT']);
assert.strictEqual(result.rejected.find(item=>item.id===exact.id).rejection.reason,'EXACT_MECHANISM_DUPLICATE');
assert.strictEqual(result.rejected.find(item=>item.id===near.id).rejection.reason,'TOO_SIMILAR_TO_EXISTING_PERSONA');

const permanentExact={referenceId:'PERMANENT_1',scope:'PERMANENT',template:templateFrom(exact),runsSinceLastUsed:3};
assert.strictEqual(similarity.filterPool({runtimeNodeId:'N12',directionId:'AI_DIRECTION_FOLLOW',candidates:[exact]},{references:[permanentExact]}).acceptedCount,0,'三局未使用的高品质相似例外未确认前，永久收藏中的完全重复仍必须阻止');

const state={runPersonaPool:['I1','I2'],equippedPersonaInstanceIds:['I1',null,null,null],personaInstancesById:{I1:{instanceId:'I1',templateId:'T1'},I2:{instanceId:'I2',templateId:'T2'}},dynamicPersonaTemplatesById:{T2:{id:'T2',conditions:[{type:'HAND_HAS_STRAIGHT'}],effects:[{type:'ADD_MULT',value:1}],growthRules:[]}}};
const collected=similarity.collectReferences({personaState:state,templatesById:{T1:{id:'T1',conditions:[{type:'HAND_HAS_FLUSH'}],effects:[{type:'ADD_CHIPS',value:10}],growthRules:[]},BASE:{id:'BASE',conditions:[{type:'HAND_QUALITY_IS',value:'NORMAL'}],effects:[{type:'ADD_CHIPS',value:10}],growthRules:[]}},permanentRecords:[{collectionId:'COL_1',templateId:'BASE',runsSinceLastUsed:2}],discardedTemplates:[{referenceId:'DROP_1',template:{id:'DROP',conditions:[{type:'HAND_HAS_FLUSH'}],effects:[{type:'ADD_MULT',value:1}],growthRules:[]}}]});
assert.deepStrictEqual(Array.from(collected.map(item=>item.scope)),['EQUIPPED','RUN_OWNED','PERMANENT','RUN_DISCARDED']);
assert.strictEqual(collected.find(item=>item.referenceId==='I2').template.id,'T2','本局动态人格模板必须可进入查重范围');

const comparison=similarity.compare(distinct,{template:templateFrom(distinct,{fingerprint:'OTHER'})});
assert.ok(comparison.rawScore>.9,'同机制仅指纹不同仍应识别为高度相似');

const source=fs.readFileSync('persona/ai/similarity.js','utf8');
assert.ok(!/\b(document|querySelector|localStorage|runController|fetch)\b/.test(source),'相似度模块不得越层读取页面、存档、流程控制器或网络');
console.log('ai-persona-similarity-tests: scope priority, exact duplicate, structural similarity, permanent guard and distinct candidates passed');
