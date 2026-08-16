const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

const storage=new Map(),events=[];
const context={Date,JSON,Number,Array,Object,String,Math,Map,Set,console,CustomEvent:function(type){this.type=type},localStorage:{getItem(key){return storage.get(key)||null},setItem(key,value){storage.set(key,value)},removeItem(key){storage.delete(key)}}};
context.window=context;context.dispatchEvent=event=>events.push(event.type);vm.createContext(context);loadBalance(context);vm.runInContext(fs.readFileSync('save-system.js','utf8'),context);
const card={r:'A',ri:14,s:'♠',si:0,c:'black',uid:'battle-0-a',templateId:'base-1',bonus:3};
context.runController.startRun('RUN_TEMPLATE_CURRENT_DEMO');
context.buildRunSaveState=()=>({runState:context.runController.serializeState(),battleIndex:0,runDeck:[card],deck:[card],hand:[card],usedCards:[],discardedCards:[],score:123,currentEncounter:{rule:{id:'repeat_judgment'},event:{id:'extra_chance'}},equippedPersonaIds:['observer']});
assert.strictEqual(context.runSave.write('battle','test'),true);
let stored=context.runSave.read();assert.strictEqual(stored.version,2);assert.strictEqual(stored.phase,'battle');assert.strictEqual(stored.state.score,123);assert.strictEqual(stored.state.runState.currentNodeId,'DEMO_BATTLE_01');assert.strictEqual(stored.state.hand[0].uid,'battle-0-a');
let restored=null;context.restoreRunSaveState=save=>{restored=save;return true};assert.strictEqual(context.runSave.restore(),true);assert.strictEqual(restored.state.currentEncounter.rule.id,'repeat_judgment');assert.strictEqual(context.runSave.summary().label,'战斗中');assert.strictEqual(context.runSave.summary().currentNodeId,'DEMO_BATTLE_01');

context.runController.startRun('RUN_TEMPLATE_PERSONA_SLICE');context.runController.completeNode({type:'BATTLE_WIN'});let sliceSerial=0;const sliceRuntime=context.PersonaRuntime.create({templates:context.PERSONA_BALANCE_MANIFEST.personaTemplates.templates,idFactory:()=>`slice-save-${++sliceSerial}`,stateStore:{get:()=>context.runController.getPersonaRuntimeState(),set:value=>context.runController.setPersonaRuntimeState(value)}});sliceRuntime.initializeRun(['TEST_SIMPLE_ADD']);const generated=sliceRuntime.createInstance('TEST_GROWTH_DIVERSITY',{source:'TEST_SAVE'});context.runController.setNodeRuntime({generatedPersonaInstanceId:generated.instanceId});context.buildRunSaveState=()=>({runState:context.runController.serializeState(),battleIndex:0,runDeck:[card],deck:[card],hand:[card],usedCards:[],discardedCards:[],score:0});assert.strictEqual(context.runSave.write('persona_growth','slice-save'),true);assert.strictEqual(context.runSave.read().state.runState.personaInstancesById[generated.instanceId].templateId,'TEST_GROWTH_DIVERSITY');assert.strictEqual(context.runSave.summary().label,'人格成长测试');

function legacySave(phase,battleIndex){return{version:1,savedAt:100,phase,reason:'legacy',state:{battleIndex,runDeck:[card],deck:[card],hand:[card],usedCards:[],discardedCards:[],score:10}}}
const mappings=[['battle',0,'DEMO_BATTLE_01'],['settlement',1,'DEMO_BATTLE_02'],['route',0,'DEMO_ROUTE_01'],['event',1,'DEMO_ROUTE_02'],['shop',1,'DEMO_ROUTE_02'],['report',0,'DEMO_REPORT'],['forge',2,'DEMO_FORGE'],['choice',1,'DEMO_FORGE'],['acquire',0,'DEMO_FORGE']];
for(const [phase,index,nodeId] of mappings){const migrated=context.runSave.migrateV1(legacySave(phase,index));assert.ok(migrated,`${phase} should migrate`);assert.strictEqual(migrated.version,2);assert.strictEqual(migrated.state.runState.currentNodeId,nodeId);assert.strictEqual(migrated.state.runState.battleIndexCompat,index);assert.strictEqual(context.runSave.validate(migrated),true)}
assert.strictEqual(context.runSave.migrateV1(legacySave('route',2)),null,'unsafe post-third-battle route must fail safely');
context.runSave.clear();storage.set(context.runSave.legacyKey,JSON.stringify(legacySave('report',1)));stored=context.runSave.read();assert.strictEqual(stored.migratedFromVersion,1);assert.strictEqual(stored.state.runState.currentNodeId,'DEMO_REPORT');assert.ok(storage.has(context.runSave.key),'migrated save should be persisted under V2 key');
storage.set(context.runSave.key,'{"broken":true}');storage.delete(context.runSave.legacyKey);assert.strictEqual(context.runSave.read(),null);context.runSave.clear();assert.strictEqual(storage.has(context.runSave.key),false);
console.log('save-system-tests: V2 atomic save, restore, summary, phase-aware V1 migration and safe invalidation passed');
