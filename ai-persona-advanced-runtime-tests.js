const assert=require('assert');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Math,JSON,Map,Set,Array,Object,String,Number,Date};context.globalThis=context;vm.createContext(context);loadBalance(context);
const makeRuntime=template=>{const runtime=context.PersonaRuntime.create({templates:[template],idFactory:()=>`${template.id}_INSTANCE`});runtime.initializeRun([template.id]);return runtime};
const base=(id,conditions,effects=[],extra={})=>({...extra,id,name:id,qualityId:'TEST',conditions,effects:[{type:'ADD_CHIPS',value:10},...effects],activationLimit:{scope:'HAND',count:1},growthRules:extra.growthRules||[],caps:extra.caps||{},runtimeDefaults:{activationCountThisBattle:0,...(extra.runtimeDefaults||{})},runtimeScopes:{activationCountThisBattle:'BATTLE',...(extra.runtimeScopes||{})}});
const hand=(type='high_card',cards=[{r:'2',ri:2,s:'♥'}],extra={})=>({submittedCards:cards,scoringCards:cards,handTypeId:type,handType:type,handPriority:1,...extra});
const score={chips:10,mult:1,xmult:1};

const collectionTemplate=base('COLLECT_HAND',[{type:'PERSONA_UNSEEN_HAND_TYPE'}],[{type:'RECORD_CONTEXT_VALUES',key:'seenHandTypes',contextField:'CURRENT_HAND_TYPE'}],{runtimeDefaults:{seenHandTypes:[]},runtimeScopes:{seenHandTypes:'RUN'}}),collection=makeRuntime(collectionTemplate);
assert.strictEqual(collection.evaluateHand(hand('pair'),{commit:false,scoreLayers:score}).chipsDelta,10);
assert.deepStrictEqual(collection.getState().personaInstancesById.COLLECT_HAND_INSTANCE.runtimeState.seenHandTypes,[],'preview must not record collection progress');
collection.evaluateHand(hand('pair'),{commit:true,scoreLayers:score});
assert.deepStrictEqual(Array.from(collection.getState().personaInstancesById.COLLECT_HAND_INSTANCE.runtimeState.seenHandTypes),['pair']);
assert.strictEqual(collection.evaluateHand(hand('pair'),{commit:false,scoreLayers:score}).chipsDelta,0,'same persona must not rediscover the same hand type');

const alternation=makeRuntime(base('NARROW_WIDE',[{type:'PREVIOUS_SUBMITTED_CARD_COUNT_AT_MOST',value:2},{type:'SUBMITTED_CARD_COUNT_AT_LEAST',value:4}]));
alternation.evaluateHand(hand('high_card',[{},{}]),{commit:true,scoreLayers:score});
assert.strictEqual(alternation.evaluateHand(hand('pair',[{},{},{},{}]),{commit:false,scoreLayers:score}).chipsDelta,10);
alternation.resetBattle();
assert.strictEqual(alternation.evaluateHand(hand('pair',[{},{},{},{}]),{commit:false,scoreLayers:score}).chipsDelta,0,'previous-hand history must clear between battles');

const suitChargeTemplate=base('SUIT_CHARGE',[{type:'PERSONA_RUNTIME_FLAG',key:'suitCharged',value:true},{type:'SCORING_SUIT_COUNT_AT_LEAST',suit:'♥',value:1}],[{type:'CLEAR_RUNTIME_FLAG',key:'suitCharged'}],{runtimeDefaults:{suitCharged:false},runtimeScopes:{suitCharged:'BATTLE'},growthRules:[{event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_SUIT_COUNT_AT_LEAST',suit:'♥',value:1}],effects:[{type:'SET_RUNTIME_FLAG',key:'suitCharged',value:true}]}]}),suitCharge=makeRuntime(suitChargeTemplate);
suitCharge.processDiscard(1,{commit:true,context:{discardedCards:[{r:'3',ri:3,s:'♥'}]}});
assert.strictEqual(suitCharge.evaluateHand(hand(),{commit:false,scoreLayers:score}).chipsDelta,10);
assert.strictEqual(suitCharge.getState().personaInstancesById.SUIT_CHARGE_INSTANCE.runtimeState.suitCharged,true,'preview must not consume charge');
suitCharge.evaluateHand(hand(),{commit:true,scoreLayers:score});
assert.strictEqual(suitCharge.getState().personaInstancesById.SUIT_CHARGE_INSTANCE.runtimeState.suitCharged,false,'commit must consume charge');

const patience=makeRuntime(base('PATIENCE',[{type:'HAND_TYPE_IS',value:'pair'},{type:'PERSONA_RUNTIME_COUNTER_AT_LEAST',key:'consecutiveMainTriggerMisses',value:2}],[],{runtimeDefaults:{consecutiveMainTriggerMisses:0},runtimeScopes:{consecutiveMainTriggerMisses:'BATTLE'}}));
patience.evaluateHand(hand('high_card'),{commit:true,scoreLayers:score});patience.evaluateHand(hand('straight'),{commit:true,scoreLayers:score});
assert.strictEqual(patience.evaluateHand(hand('pair'),{commit:false,scoreLayers:score}).chipsDelta,10);
patience.evaluateHand(hand('pair'),{commit:true,scoreLayers:score});
assert.strictEqual(patience.getState().personaInstancesById.PATIENCE_INSTANCE.runtimeState.consecutiveMainTriggerMisses,0);

console.log('ai-persona-advanced-runtime-tests: per-persona collection, alternation history, suit charge and two-miss cashout passed');
