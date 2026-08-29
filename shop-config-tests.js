const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const ShopRuntime=require('./shop/shop-runtime');

const context={console};context.globalThis=context;vm.createContext(context);
for(const file of ['balance/base-personas.js','balance/target/shop-config.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const rawConfig=context.PERSONA_BALANCE_MODULES.targetShop;
const config=JSON.parse(JSON.stringify(rawConfig));

function containsFunction(value,seen=new Set()){
  if(typeof value==='function')return true;
  if(!value||typeof value!=='object'||seen.has(value))return false;
  seen.add(value);
  return Object.values(value).some(child=>containsFunction(child,seen));
}
function sequenceRandom(values){let index=0;return()=>{assert.ok(index<values.length,'fixed random sequence exhausted');return values[index++]}}

assert.strictEqual(containsFunction(rawConfig),false,'final shop config must not contain executable functions');
assert.strictEqual(config.id,'TARGET_SHOP_V1');
assert.strictEqual(config.version,1);
assert.strictEqual(config.items.length,65);
assert.strictEqual(config.items.filter(item=>item.itemType==='CARD').length,52);
assert.strictEqual(config.items.filter(item=>item.itemType==='PERSONA').length,8);
assert.strictEqual(config.items.filter(item=>item.itemType==='SERVICE').length,5);
assert.strictEqual(new Set(config.items.map(item=>item.id)).size,65);
assert.ok(config.items.every(item=>item.purchaseLimit===1&&item.purchaseLimitScope==='SHOP_VISIT'));
assert.ok(config.items.every(item=>item.fieldDecisionStatus.purchaseLimitScope==='PROTOTYPE_ASSUMPTION'));
assert.strictEqual(config.assumptions.offerSlotCount.value,4);
assert.strictEqual(config.assumptions.offerSlotCount.decisionStatus,'CONFIRMED');
assert.strictEqual(config.assumptions.purchaseLimitScope.value,'SHOP_VISIT');
assert.strictEqual(config.assumptions.purchaseLimitScope.decisionStatus,'PROTOTYPE_ASSUMPTION');

const suitGroups=[['黑桃','♠'],['红桃','♥'],['梅花','♣'],['方块','♦']],ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const expectedCards=suitGroups.flatMap(([suitName,suitSymbol])=>ranks.map(rank=>({name:`${suitName}${rank}`,suitSymbol,rank})));
const cards=config.items.filter(item=>item.itemType==='CARD');
cards.forEach((item,index)=>{
  const sequence=String(index+1).padStart(3,'0'),expected=expectedCards[index];
  assert.strictEqual(item.id,`SHOP_CARD_${sequence}`);
  assert.strictEqual(item.name,expected.name);
  assert.strictEqual(item.price,2);
  assert.strictEqual(item.effect.type,'ADD_CARD');
  assert.strictEqual(item.effect.quantity,1);
  assert.strictEqual(item.effect.cardConfigId,`CARD_${sequence}`);
  assert.strictEqual(item.effect.card.suitSymbol,expected.suitSymbol);
  assert.strictEqual(String(item.effect.card.rank),expected.rank);
  assert.deepStrictEqual(item.sourceEffect,{type:'增加卡牌',parameter1:1,parameter2:null});
});

const personaIds=['observer','wanderer','pathfinder','restraint','collector','resonance','commitment','purger'];
const basePersonaIds=context.PERSONA_BALANCE_MODULES.basePersonas.templates.map(item=>item.id);
assert.deepStrictEqual(Array.from(basePersonaIds),personaIds);
const personas=config.items.filter(item=>item.itemType==='PERSONA');
personas.forEach((item,index)=>{
  const sequence=String(index+1).padStart(3,'0');
  assert.strictEqual(item.id,`SHOP_PER_${sequence}`);
  assert.strictEqual(item.name,`人格牌${String(index+1).padStart(2,'0')}`);
  assert.strictEqual(item.price,13);
  assert.strictEqual(item.effect.type,'ADD_PERSONA');
  assert.strictEqual(item.effect.quantity,1);
  assert.strictEqual(item.effect.personaTemplateId,personaIds[index]);
});

const expectedServices=[
  ['SHOP_SERVICE_001','筹码强化',5,'BONUS_CHIPS',5],
  ['SHOP_SERVICE_002','金币强化',6,'BONUS_COINS',2],
  ['SHOP_SERVICE_003','倍率强化',6,'BONUS_MULT',.5],
  ['SHOP_SERVICE_004','独立乘区强化',8,'BONUS_XMULT_RATE',.03],
  ['SHOP_SERVICE_005','卡牌移除',5,null,1]
];
const services=config.items.filter(item=>item.itemType==='SERVICE');
services.forEach((item,index)=>{
  const [id,name,price,targetStat,amount]=expectedServices[index];
  assert.strictEqual(item.id,id);assert.strictEqual(item.name,name);assert.strictEqual(item.price,price);
  if(targetStat){assert.strictEqual(item.effect.type,'UPGRADE_CARD');assert.strictEqual(item.effect.targetStat,targetStat);assert.strictEqual(item.effect.amount,amount);assert.strictEqual(item.effect.requiresTarget,true)}
  else{assert.strictEqual(item.effect.type,'REMOVE_CARD');assert.strictEqual(item.effect.quantity,amount);assert.strictEqual(item.effect.requiresTarget,true)}
});
assert.strictEqual(services[3].sourceEffect.parameter2Display,'3%');

const expectedRefresh={
  AI1:{node:'N04',ids:['REFRESH_001','REFRESH_002','REFRESH_003'],weights:[45,20,35]},
  AI2:{node:'N08',ids:['REFRESH_005','REFRESH_006','REFRESH_007'],weights:[40,25,35]},
  AI3:{node:'N12',ids:['REFRESH_008','REFRESH_009','REFRESH_010'],weights:[30,30,40]}
};
assert.strictEqual(config.refreshProfiles.length,3);
for(const profile of config.refreshProfiles){
  const expected=expectedRefresh[profile.id];assert.ok(expected);
  assert.strictEqual(profile.stageNodeId,expected.node);assert.strictEqual(profile.offerSlotCount,4);
  assert.strictEqual(profile.fieldDecisionStatus.offerSlotCount,'CONFIRMED');
  assert.deepStrictEqual(profile.typeRules.map(rule=>rule.id),expected.ids);
  assert.deepStrictEqual(profile.typeRules.map(rule=>rule.itemType),['CARD','PERSONA','SERVICE']);
  assert.deepStrictEqual(profile.typeRules.map(rule=>rule.appearanceCount),[1,1,1]);
  assert.deepStrictEqual(profile.typeRules.map(rule=>rule.weight),expected.weights);
  assert.strictEqual(profile.typeRules.reduce((sum,rule)=>sum+rule.weight,0),100);
}

assert.strictEqual(config.poolEntries.length,65);
assert.strictEqual(new Set(config.poolEntries.map(entry=>entry.id)).size,65);
assert.strictEqual(new Set(config.poolEntries.map(entry=>entry.itemId)).size,65);
assert.deepStrictEqual(config.poolEntries.slice(0,52).map(entry=>entry.weight),new Array(52).fill(1));
assert.deepStrictEqual(config.poolEntries.slice(52,60).map(entry=>entry.weight),new Array(8).fill(10));
assert.deepStrictEqual(config.poolEntries.slice(60).map(entry=>entry.weight),new Array(5).fill(20));
config.poolEntries.forEach((entry,index)=>{
  if(index<52)assert.strictEqual(entry.id,`POLL_CARD_${String(index+1).padStart(3,'0')}`);
  else if(index<60)assert.strictEqual(entry.id,`POOL_PERSONA_${String(index-51).padStart(3,'0')}`);
  else assert.strictEqual(entry.id,`POOL_SERVICE_${String(index-59).padStart(3,'0')}`);
  const item=config.items.find(candidate=>candidate.id===entry.itemId);assert.ok(item);assert.strictEqual(entry.poolType,item.itemType);
});

const beforeRefresh=JSON.stringify(config);
const mixed=ShopRuntime.generateOffers({config,profileId:'AI1',random:sequenceRandom([0,0,.5,.1,.9,.99,.2,.3]),refreshIndex:2});
assert.strictEqual(mixed.offers.length,4);
assert.deepStrictEqual(mixed.offers.map(offer=>offer.offerId),['AI1:2:01','AI1:2:02','AI1:2:03','AI1:2:04']);
assert.strictEqual(JSON.stringify(config),beforeRefresh,'offer generation must not mutate config');
const lowest=ShopRuntime.generateOffers({config,profileId:'AI1',random:()=>0});
assert.deepStrictEqual(lowest.offers.map(offer=>offer.itemId),['SHOP_CARD_001','SHOP_CARD_002','SHOP_CARD_003','SHOP_CARD_004']);
assert.strictEqual(new Set(lowest.offers.map(offer=>offer.itemId)).size,lowest.offers.length,'one shop cannot contain duplicate items');
const filtered=ShopRuntime.generateOffers({config,profileId:'AI3',eligibleItemIds:['SHOP_PER_008'],random:()=>0});
assert.deepStrictEqual(filtered.offers.map(offer=>offer.itemId),['SHOP_PER_008']);

const spadeAce=ShopRuntime.createCardFromItem(cards[0],{instanceKey:'N04-01'});
assert.deepStrictEqual({r:spadeAce.r,ri:spadeAce.ri,s:spadeAce.s,si:spadeAce.si,c:spadeAce.c},{r:'A',ri:14,s:'♠',si:0,c:'black'});
assert.strictEqual(spadeAce.uid,'shop-N04-01');assert.strictEqual(spadeAce.templateId,'shop-template-N04-01');assert.strictEqual(spadeAce.sourceCardConfigId,'CARD_001');
const clubAce=ShopRuntime.createCardFromItem(cards[26]);assert.deepStrictEqual({r:clubAce.r,s:clubAce.s,si:clubAce.si},{r:'A',s:'♣',si:3});
const diamondKing=ShopRuntime.createCardFromItem(cards[51]);assert.deepStrictEqual({r:diamondKing.r,ri:diamondKing.ri,s:diamondKing.s,si:diamondKing.si,c:diamondKing.c},{r:'K',ri:13,s:'♦',si:2,c:'red'});

let upgraded=spadeAce;
for(const service of services.slice(0,4))upgraded=ShopRuntime.applyCardUpgrade(upgraded,service);
assert.deepStrictEqual(ShopRuntime.cardUpgradeAttributes(upgraded),{bonusChips:5,bonusCoins:2,bonusMult:.5,bonusXmultRate:.03,bonusXmultFactor:1.03});
assert.deepStrictEqual(ShopRuntime.cardUpgradeAttributes(spadeAce),{bonusChips:0,bonusCoins:0,bonusMult:0,bonusXmultRate:0,bonusXmultFactor:1},'card upgrade must not mutate its target');
assert.strictEqual(ShopRuntime.describeEffect(services[0]),'选择1张牌，筹码+5。');
assert.strictEqual(ShopRuntime.describeEffect(services[1]),'选择1张牌，金币+2。');
assert.strictEqual(ShopRuntime.describeEffect(services[2]),'选择1张牌，基础倍率+0.5。');
assert.strictEqual(ShopRuntime.describeEffect(services[3]),'选择1张牌，独立倍率+3%。');
assert.strictEqual(ShopRuntime.describeEffect(services[4]),'移除1张牌。');
assert.strictEqual(ShopRuntime.describeEffect(cards.find(item=>item.name==='红桃5')),'一张红桃5扑克牌。');
assert.strictEqual(ShopRuntime.describeEffect(cards.find(item=>item.name==='方块10')),'一张方片10扑克牌。');
assert.strictEqual(ShopRuntime.describeEffect(personas[6]),'获得人格牌07。');

const removal=ShopRuntime.removeCardByUid([spadeAce,clubAce],spadeAce.uid);assert.strictEqual(removal.removed.uid,spadeAce.uid);assert.deepStrictEqual(removal.cards.map(card=>card.uid),[clubAce.uid]);
assert.deepStrictEqual(ShopRuntime.purchaseAvailability({item:cards[0],coins:1,purchaseCount:0}),{allowed:false,reason:'INSUFFICIENT_COINS'});
assert.deepStrictEqual(ShopRuntime.purchaseAvailability({item:cards[0],coins:2,purchaseCount:1}),{allowed:false,reason:'PURCHASE_LIMIT_REACHED'});
assert.deepStrictEqual(ShopRuntime.purchaseAvailability({item:cards[0],coins:2,purchaseCount:0}),{allowed:true,reason:'AVAILABLE'});

console.log('shop-config-tests: 65 items, exact mappings, AI weights, pools, assumptions, deterministic no-duplicate refresh and card service attributes passed');
