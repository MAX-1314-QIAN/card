const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

function element(){return{innerHTML:'',textContent:'',disabled:false,checked:false,open:false,value:'all',style:{setProperty(){},removeProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map();
const documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const localData=new Map();
const context={console,setTimeout(fn){fn()},clearTimeout,document:documentStub,window:{showRouteMap(){},showBattleFromRoute(){},goMainMenuFromRun(){}},localStorage:{getItem(key){return localData.get(key)||null},setItem(key,value){localData.set(key,value)},removeItem(key){localData.delete(key)}},Math,Date,Set,Map,JSON,Number,Array,Object,String};
context.window.gameSfx=()=>{};context.window.commitRunSave=()=>true;context.window.clearRunSave=()=>{};context.window=context;
vm.createContext(context);loadBalance(context);vm.runInContext(fs.readFileSync('persona/persona-collection.js','utf8'),context);vm.runInContext(fs.readFileSync('game.js','utf8'),context);vm.runInContext(fs.readFileSync('save-system.js','utf8'),context);

const controller=context.runController,templateId=context.PERSONA_BALANCE_MANIFEST.activeRunTemplateId;
controller.startRun(templateId,{offlineAiPersonaEnabled:true});
function completeBattle(nodeId){assert.strictEqual(controller.getState().currentNodeId,nodeId);controller.completeNode({type:'BATTLE_WIN',nodeId})}
function restoreGrowth(expectedId){const before=controller.serializeState(),save={version:3,phase:'persona_growth',state:vm.runInContext('buildRunSaveState()',context)};assert.strictEqual(context.runSave.validate(save),true);context.__save=save;assert.strictEqual(vm.runInContext('restoreRunSaveState(globalThis.__save)',context),true);assert.strictEqual(controller.getCurrentRuntime().data.generatedPersonaInstanceId,expectedId);assert.strictEqual(controller.getPersonaRuntimeState().personaInstancesById[expectedId].templateId,before.personaInstancesById[expectedId].templateId)}
function generatedAt(nodeId){const data=controller.getState().nodeRuntimeById[nodeId].data,id=data.generatedPersonaInstanceId,state=controller.getPersonaRuntimeState(),instance=state.personaInstancesById[id],template=state.dynamicPersonaTemplatesById[instance.templateId];assert.ok(instance&&template,`${nodeId} must create a dynamic persona`);assert.strictEqual(instance.source,'AI_GENERATED_OFFLINE_DEV');assert.ok(data.aiPersonaGeneration?.mechanismFingerprint);return{id,instance,template,data}}
function leaveGrowthShop(){vm.runInContext("completeRouteNode({routeType:'shop'})",context)}

completeBattle('N01');completeBattle('N02');completeBattle('N03');
const n04=generatedAt('N04');assert.strictEqual(n04.template.name,'AI人格001');restoreGrowth(n04.id);vm.runInContext('growthSelectedSlot=0;confirmPersonaGrowth()',context);assert.strictEqual(controller.getPersonaRuntimeState().equippedPersonaInstanceIds[0],n04.id);leaveGrowthShop();

completeBattle('N05');completeBattle('N06');completeBattle('N07');
const n08=generatedAt('N08');assert.strictEqual(n08.template.name,'AI人格002');assert.notStrictEqual(n08.data.aiPersonaGeneration.directionId,n04.data.aiPersonaGeneration.directionId);restoreGrowth(n08.id);vm.runInContext('keepPersonaGrowth()',context);assert.ok(!controller.getPersonaRuntimeState().equippedPersonaInstanceIds.includes(n08.id));leaveGrowthShop();

completeBattle('N09');completeBattle('N10');completeBattle('N11');
const n12=generatedAt('N12');assert.strictEqual(n12.template.name,'AI人格003');assert.strictEqual(n12.data.aiPersonaGeneration.directionId,'AI_DIRECTION_FOLLOW');restoreGrowth(n12.id);vm.runInContext('growthSelectedSlot=1;confirmPersonaGrowth()',context);assert.strictEqual(controller.getPersonaRuntimeState().equippedPersonaInstanceIds[1],n12.id);leaveGrowthShop();

completeBattle('N13');completeBattle('N14');completeBattle('N15');assert.strictEqual(controller.getState().currentNodeId,'N16');leaveGrowthShop();completeBattle('N17');assert.strictEqual(controller.getState().currentNodeId,'TARGET_RUN_REPORT');vm.runInContext('confirmTargetReport()',context);assert.strictEqual(controller.getState().currentNodeId,'TARGET_PERSONA_CARRY_OUT');context.__carryId=n12.id;vm.runInContext('targetCarrySelectionId=globalThis.__carryId;confirmTargetCarry()',context);
const result=controller.getRunResult();context.__collectionCardId=result.permanentCollectionCardId;const record=vm.runInContext('personaCollection.get(globalThis.__collectionCardId)',context);assert.strictEqual(record.templateSnapshot.name,'AI人格003');assert.ok(record.templateSnapshot.aiPersonaMeta);assert.ok(!('runtimeState' in record)&&!('subAffixSlots' in record));assert.strictEqual(record.templateSnapshot.subAffixRules.defaultUnlockedCount,0);assert.deepStrictEqual(Array.from(record.templateSnapshot.subAffixRules.poolIds),[]);
context.__baseIds=['observer','wanderer','pathfinder'];vm.runInContext('equippedPersonaIds=[globalThis.__collectionCardId,...globalThis.__baseIds];syncPermanentPersonaPool()',context);controller.startRun(templateId);const nextRunState=controller.getPersonaRuntimeState(),nextRunId=`COLLECTION_RUN_${record.collectionId}`,nextRunInstance=nextRunState.personaInstancesById[nextRunId];assert.ok(nextRunInstance,'carried persona must be available for the next run loadout');assert.deepStrictEqual(nextRunInstance.runtimeState,record.templateSnapshot.runtimeDefaults);assert.ok(nextRunInstance.subAffixSlots.every(slot=>slot.unlocked===false&&slot.affixId===null),'run growth and affix unlocks must reset on the next run');assert.strictEqual(controller.getState().developerOptions.offlineAiPersonaEnabled,false,'offline generation must return to off unless the new run explicitly enables it');

console.log('ai-persona-dev-flow-tests: N04/N08/N12 generation, stable restore, equip replacement, permanent carry-out and clean next-run loadout passed');
