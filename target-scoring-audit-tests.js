const assert=require('assert');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');
const context={console,Map,Set,Array,Object,String,Number,Math,JSON,Date};context.globalThis=context;vm.createContext(context);loadBalance(context);
const manifest=context.PERSONA_BALANCE_MANIFEST,current=manifest.pokerHandProfiles.find(item=>item.id==='POKER_HAND_PROFILE_CURRENT_DEMO'),target=manifest.pokerHandProfiles.find(item=>item.id==='POKER_HAND_PROFILE_TARGET_V1');
assert.strictEqual(current.hands.find(item=>item.id==='high_card').chips,5,'CURRENT_DEMO scoring must remain unchanged');
assert.strictEqual(target.hands.length,9);assert.ok(target.hands.every(item=>item.decisionStatus==='DERIVED'));
for(const hand of target.hands){
  const directScore=(hand.rawBaseChips+hand.typicalFaceChips)*hand.mult,derivedScore=(hand.chips+hand.typicalFaceChips)*hand.mult;
  assert.ok(directScore>hand.targetSingleHandScore,`${hand.id} direct import should demonstrate double counting`);
  assert.ok(Math.abs(derivedScore-hand.targetSingleHandScore)<1e-8,`${hand.id} derived base chips must preserve target anchor`);
  assert.ok(Math.abs(hand.derivedTargetBaseChips-(hand.targetSingleHandScore/hand.mult-hand.typicalFaceChips))<1e-8);
}
console.log('target-scoring-audit-tests: 9 target hands preserve anchors, prove direct-import double counting, and isolate CURRENT_DEMO');
