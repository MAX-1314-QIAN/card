const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

const storage=new Map(),events=[];
const context={Date,JSON,Number,Array,Object,String,Math,Map,Set,console,CustomEvent:function(type){this.type=type},localStorage:{getItem(key){return storage.get(key)||null},setItem(key,value){storage.set(key,value)},removeItem(key){storage.delete(key)}}};
context.window=context;context.dispatchEvent=event=>events.push(event.type);vm.createContext(context);loadBalance(context);vm.runInContext(fs.readFileSync('save-system.js','utf8'),context);
const card={r:'A',ri:14,s:'♠',si:0,c:'black',uid:'battle-0-a',templateId:'base-1',bonus:3};

context.runController.startRun('RUN_TEMPLATE_TARGET');
context.buildRunSaveState=()=>({runState:context.runController.serializeState(),battleIndex:0,coins:0,runDeck:[card],deck:[card],hand:[card],usedCards:[],discardedCards:[],score:123,currentEncounter:{maxSelection:5,startingHands:4,startingDiscards:3},equippedPersonaIds:['observer']});
assert.strictEqual(context.runSave.write('battle','test'),true);
let stored=context.runSave.read();assert.strictEqual(stored.version,3);assert.strictEqual(stored.phase,'battle');assert.strictEqual(stored.state.score,123);assert.strictEqual(stored.state.runState.currentNodeId,'N01');assert.strictEqual(stored.state.hand[0].uid,'battle-0-a');
let restored=null;context.restoreRunSaveState=save=>{restored=save;return true};assert.strictEqual(context.runSave.restore(),true);assert.strictEqual(restored.state.currentEncounter.maxSelection,5);assert.ok(!('rule' in restored.state.currentEncounter)&&!('event' in restored.state.currentEncounter));assert.strictEqual(context.runSave.summary().label,'战斗中');assert.strictEqual(context.runSave.summary().currentNodeId,'N01');
assert.strictEqual(context.runSave.write('stage_intro','stage-intro'),true);assert.strictEqual(context.runSave.summary().label,'关卡揭示');

context.runController.startRun('RUN_TEMPLATE_TARGET');context.runController.completeNode({type:'BATTLE_WIN'});context.runController.completeNode({type:'BATTLE_WIN'});context.runController.completeNode({type:'BATTLE_WIN'});let personaSerial=0;const targetRuntime=context.PersonaRuntime.create({templates:context.PERSONA_BALANCE_MANIFEST.personaTemplates.templates,idFactory:()=>`target-save-${++personaSerial}`,stateStore:{get:()=>context.runController.getPersonaRuntimeState(),set:value=>context.runController.setPersonaRuntimeState(value)}});targetRuntime.initializeRun(['TEST_SIMPLE_ADD']);const generated=targetRuntime.createInstance('TEST_GROWTH_DIVERSITY',{source:'TEST_SAVE'});context.runController.setNodeRuntime({generatedPersonaInstanceId:generated.instanceId});context.buildRunSaveState=()=>({runState:context.runController.serializeState(),battleIndex:2,runDeck:[card],deck:[card],hand:[card],usedCards:[],discardedCards:[],score:0,coins:0});assert.strictEqual(context.runSave.write('persona_growth','target-save'),true);assert.strictEqual(context.runSave.read().state.runState.personaInstancesById[generated.instanceId].templateId,'TEST_GROWTH_DIVERSITY');assert.strictEqual(context.runSave.summary().label,'人格成长测试');

const oldV1={version:1,savedAt:100,phase:'report',reason:'legacy',state:{battleIndex:1,runDeck:[card],deck:[card],hand:[card],usedCards:[],discardedCards:[],score:10}};
const oldV2={version:2,savedAt:100,phase:'battle',reason:'legacy-v2',state:{...context.buildRunSaveState(),runState:{runTemplateId:'RUN_TEMPLATE_CURRENT_DEMO',currentNodeId:'DEMO_BATTLE_01',nodeStatus:'IN_PROGRESS',completedNodeIds:[],battleIndexCompat:0,transitionVersion:1,nodeRuntimeById:{}}}};
context.runSave.clear();storage.set('persona-run-save-v1',JSON.stringify(oldV1));storage.set('persona-run-save-v2',JSON.stringify(oldV2));assert.strictEqual(context.runSave.read(),null,'old topology saves must be invalidated');assert.strictEqual(storage.has('persona-run-save-v1'),false);assert.strictEqual(storage.has('persona-run-save-v2'),false);assert.strictEqual(context.runSave.hadInvalidatedLegacySave(),true);
context.runSave.clear();assert.strictEqual(context.runSave.hadInvalidatedLegacySave(),false);storage.set(context.runSave.key,'{"broken":true}');assert.strictEqual(context.runSave.read(),null);assert.strictEqual(storage.has(context.runSave.key),false);
console.log('save-system-tests: V3 atomic save, restore, summary, persona state, old topology invalidation and corrupt-save cleanup passed');
