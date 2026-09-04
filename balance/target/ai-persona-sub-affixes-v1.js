(function(root){
  'use strict';
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const definitions=[
    ['AI_SUB2_CHIPS_050',0,'BASE_CHIPS',5,34,'触发时额外 +5 筹码'],
    ['AI_SUB2_MULT_050',0,'BASE_MULT',.15,33,'触发时额外 +0.15 倍率'],
    ['AI_SUB2_XMULT_050',0,'XMULT_RATE',.05,33,'触发时额外 +5% 独立倍率'],
    ['AI_SUB3_CHIPS_100',1,'BASE_CHIPS',10,34,'触发时额外 +10 筹码'],
    ['AI_SUB3_MULT_100',1,'BASE_MULT',.3,33,'触发时额外 +0.3 倍率'],
    ['AI_SUB3_XMULT_100',1,'XMULT_RATE',.1,33,'触发时额外 +10% 独立倍率']
  ];
  const effectType={BASE_CHIPS:'ADD_CHIPS',BASE_MULT:'ADD_MULT',XMULT_RATE:'ADD_XMULT_RATE'};
  const entries=definitions.map(([id,slotIndex,attributeType,value,weight,effectText])=>({id,slotIndex,attributePosition:slotIndex+2,slotIndexes:[slotIndex],weight,attributeType,operation:'ADD',value,valueUnit:attributeType==='XMULT_RATE'?'RATE':'FLAT',unlockProfileId:'AI1',unlockProfileOrder:1,name:{BASE_CHIPS:'基础筹码',BASE_MULT:'基础倍率',XMULT_RATE:'独立倍率'}[attributeType],effectText,effects:[{type:effectType[attributeType],value,phase:'PERSONA_SUB_ATTRIBUTE'}],runtimeEnabled:true,decisionStatus:'CONFIRMED'}));
  modules.targetAiPersonaSubAffixes={id:'TARGET_AI_PERSONA_SUB_AFFIXES_V1',schemaVersion:1,unlockCosts:[...modules.targetEconomy.personaAffixes.unlockCosts],disallowSameAttributeType:true,slotPools:[{slotIndex:0,attributePosition:2,weightTotal:100,entryIds:entries.filter(item=>item.slotIndex===0).map(item=>item.id)},{slotIndex:1,attributePosition:3,weightTotal:100,entryIds:entries.filter(item=>item.slotIndex===1).map(item=>item.id)}],entries,decisionStatus:'CONFIRMED'};
})(globalThis);
