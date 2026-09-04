(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const affixUnlockCosts=modules.targetEconomy.personaAffixes.unlockCosts;
  const decisionStatus='CONFIRMED',profileOrder={AI1:1,AI2:2,AI3:3};
  const entries=[
    {id:'ENTRY_001',name:'重复',triggerText:'连续两次使用相同牌型',conditions:[{type:'SAME_HAND_TYPE_STREAK_AT_LEAST',value:2}]},
    {id:'ENTRY_002',name:'数量',triggerText:'本次计分牌数量达到 4 张以上',conditions:[{type:'SCORING_CARD_COUNT_AT_LEAST',value:4}]},
    {id:'ENTRY_003',name:'冒险',triggerText:'打出普通品质牌型',conditions:[{type:'HAND_QUALITY_IS',value:'NORMAL'}]},
    {id:'ENTRY_004',name:'节制',triggerText:'本回合没有使用弃牌',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'discardedSinceLastPlay',value:false}]},
    {id:'ENTRY_005',name:'整理',triggerText:'使用弃牌后的下一次出牌',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'charged',value:true}]},
    {id:'ENTRY_006',name:'专注',triggerText:'连续两次使用不同牌型',conditions:[{type:'DIFFERENT_FROM_PREVIOUS_HAND'}]},
    {id:'ENTRY_007',name:'灵活',triggerText:'本次出牌数量不超过 4 张',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_MOST',value:4}]},
    {id:'ENTRY_008',name:'赌徒',triggerText:'打出稀有品质牌型',conditions:[{type:'HAND_QUALITY_IS',value:'RARE'}]}
  ];
  const mainAttributes=[
    {id:'MAIN_001',attributeType:'BASE_CHIPS',effectText:'+15 基础筹码',effects:[{type:'ADD_CHIPS',value:15,phase:'PERSONA_ADDITIVE'}]},
    {id:'MAIN_002',attributeType:'BASE_MULT',effectText:'+1 基础倍率',effects:[{type:'ADD_MULT',value:1,phase:'PERSONA_ADDITIVE'}]},
    {id:'MAIN_003',attributeType:'BASE_CHIPS',effectText:'+40 基础筹码',effects:[{type:'ADD_CHIPS',value:40,phase:'PERSONA_ADDITIVE'}]},
    {id:'MAIN_004',attributeType:'BASE_CHIPS',effectText:'+30 基础筹码',effects:[{type:'ADD_CHIPS',value:30,phase:'PERSONA_ADDITIVE'}]},
    {id:'MAIN_005',attributeType:'BASE_MULT',effectText:'+1 基础倍率',effects:[{type:'ADD_MULT',value:1,phase:'PERSONA_ADDITIVE'},{type:'CLEAR_RUNTIME_FLAG',key:'charged',phase:'POST_COMMIT'}]},
    {id:'MAIN_006',attributeType:'BASE_CHIPS',effectText:'+20 基础筹码',effects:[{type:'ADD_CHIPS',value:20,phase:'PERSONA_ADDITIVE'}]},
    {id:'MAIN_007',attributeType:'BASE_CHIPS',effectText:'+20 基础筹码',effects:[{type:'ADD_CHIPS',value:20,phase:'PERSONA_ADDITIVE'}]},
    {id:'MAIN_008',attributeType:'XMULT_RATE',effectText:'+5% 独立倍率',effects:[{type:'ADD_XMULT_RATE',value:.05,phase:'PERSONA_FINAL'}]}
  ];
  const subRows=[
    ['SUB_001','PER_001',40,'BASE_CHIPS',8,'AI1'],['SUB_002','PER_001',25,'BASE_MULT',.3,'AI1'],['SUB_003','PER_001',20,'BASE_CHIPS',10,'AI2'],['SUB_004','PER_001',10,'BASE_CHIPS',20,'AI1'],['SUB_005','PER_001',5,'XMULT_RATE',.03,'AI1'],
    ['SUB_006','PER_002',35,'BASE_MULT',.3,'AI2'],['SUB_007','PER_002',30,'BASE_CHIPS',8,'AI1'],['SUB_008','PER_002',20,'BASE_CHIPS',12,'AI2'],['SUB_009','PER_002',10,'BASE_CHIPS',15,'AI3'],['SUB_010','PER_002',5,'XMULT_RATE',.03,'AI1'],
    ['SUB_011','PER_003',40,'BASE_CHIPS',15,'AI2'],['SUB_012','PER_003',25,'BASE_MULT',.5,'AI3'],['SUB_013','PER_003',15,'XMULT_RATE',.03,'AI1'],['SUB_014','PER_003',10,'HAND_LIMIT',1,'AI2'],['SUB_015','PER_003',10,'COINS',5,'AI3'],
    ['SUB_016','PER_004',35,'BASE_CHIPS',10,'AI1'],['SUB_017','PER_004',25,'DISCARD_LIMIT',1,'AI2'],['SUB_018','PER_004',20,'BASE_MULT',.3,'AI3'],['SUB_019','PER_004',10,'HAND_LIMIT',1,'AI1'],['SUB_020','PER_004',10,'COINS',5,'AI2'],
    ['SUB_021','PER_005',35,'BASE_MULT',.5,'AI3'],['SUB_022','PER_005',25,'BASE_CHIPS',15,'AI1'],['SUB_023','PER_005',15,'DISCARD_LIMIT',1,'AI2'],['SUB_024','PER_005',15,'XMULT_RATE',.03,'AI3'],['SUB_025','PER_005',10,'HAND_LIMIT',1,'AI2'],
    ['SUB_026','PER_006',35,'BASE_CHIPS',10,'AI1'],['SUB_027','PER_006',25,'BASE_MULT',.3,'AI2'],['SUB_028','PER_006',15,'HAND_LIMIT',1,'AI2'],['SUB_029','PER_006',15,'XMULT_RATE',.03,'AI2'],['SUB_030','PER_006',10,'COINS',5,'AI3'],
    ['SUB_031','PER_007',40,'BASE_CHIPS',8,'AI1'],['SUB_032','PER_007',25,'BASE_MULT',.3,'AI1'],['SUB_033','PER_007',15,'HAND_LIMIT',1,'AI2'],['SUB_034','PER_007',10,'XMULT_RATE',.03,'AI2'],['SUB_035','PER_007',10,'COINS',5,'AI2'],
    ['SUB_036','PER_008',35,'XMULT_RATE',.03,'AI1'],['SUB_037','PER_008',25,'BASE_MULT',.5,'AI1'],['SUB_038','PER_008',20,'BASE_CHIPS',20,'AI2'],['SUB_039','PER_008',10,'HAND_LIMIT',1,'AI2'],['SUB_040','PER_008',10,'COINS',8,'AI2']
  ];
  const labels={BASE_CHIPS:'基础筹码',BASE_MULT:'基础倍率',XMULT_RATE:'独立倍率',HAND_LIMIT:'出牌次数',DISCARD_LIMIT:'弃牌次数',COINS:'金币'};
  const effectFor=(type,value)=>type==='BASE_CHIPS'?[{type:'ADD_CHIPS',value,phase:'PERSONA_SUB_ATTRIBUTE'}]:type==='BASE_MULT'?[{type:'ADD_MULT',value,phase:'PERSONA_SUB_ATTRIBUTE'}]:type==='XMULT_RATE'?[{type:'ADD_XMULT_RATE',value,phase:'PERSONA_SUB_ATTRIBUTE'}]:type==='HAND_LIMIT'?[{type:'ADD_HAND_LIMIT',value,phase:'BATTLE_ENTRY'}]:type==='DISCARD_LIMIT'?[{type:'ADD_DISCARD_LIMIT',value,phase:'BATTLE_ENTRY'}]:type==='COINS'?[{type:'ADD_COINS',value,phase:'PERSONA_SUB_ATTRIBUTE'}]:[];
  const textFor=(type,value)=>`+${type==='XMULT_RATE'?Number((value*100).toFixed(4))+'%':value} ${labels[type]}`;
  const subAffixPool=subRows.map(([id,personaId,weight,attributeType,value,unlockProfileId])=>({id,personaId,weight,attributeType,operation:'ADD',value,valueUnit:attributeType==='XMULT_RATE'?'RATE':'FLAT',unlockProfileId,unlockProfileOrder:profileOrder[unlockProfileId],name:labels[attributeType],effectText:textFor(attributeType,value),effects:effectFor(attributeType,value),runtimeEnabled:true,decisionStatus:'CONFIRMED'}));
  const internalIds=['observer','wanderer','pathfinder','restraint','collector','resonance','commitment','purger'],tones=['#54445f','#797284','#7f787f','#48414f','#654857','#3e5868','#6b5947','#4d3e61'],portraits=['personas-v2/persona-01-original-v1.png','personas-v2/persona-02-original-v1.png','personas-v2/persona-03-original-v1.png','personas-v2/persona-04-original-v1.png','personas-v2/persona-05-original-v1.png','personas-v2/persona-06-original-v1.png','personas-v2/persona-07-original-v1.png','personas-v2/persona-08-original-v1.png'];
  const templates=internalIds.map((id,index)=>{
    const number=String(index+1).padStart(3,'0'),personaId=`PER_${number}`,entry=entries[index],main=mainAttributes[index],runtimeDefaults={activationCountThisBattle:0},runtimeScopes={activationCountThisBattle:'BATTLE'},growthRules=[];
    if(personaId==='PER_004'){runtimeDefaults.discardedSinceLastPlay=false;runtimeScopes.discardedSinceLastPlay='BATTLE';growthRules.push({event:'DISCARD_COMMITTED',conditions:[],effects:[{type:'SET_RUNTIME_FLAG',key:'discardedSinceLastPlay',value:true}]},{event:'HAND_COMMITTED',conditions:[],effects:[{type:'SET_RUNTIME_FLAG',key:'discardedSinceLastPlay',value:false}]})}
    if(personaId==='PER_005'){runtimeDefaults.charged=false;runtimeScopes.charged='BATTLE';growthRules.push({event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:1}],effects:[{type:'SET_RUNTIME_FLAG',key:'charged',value:true}]})}
    return{id,personaId,displayId:`人格牌${String(index+1).padStart(2,'0')}`,name:`人格牌${String(index+1).padStart(2,'0')}`,code:`PERSONA_${String(index+1).padStart(2,'0')}`,entryId:entry.id,mainAttributeId:main.id,mainEntry:entry.name,mainEffect:{triggerText:entry.triggerText,effectText:main.effectText},conditions:entry.conditions.map(condition=>({...condition})),effects:main.effects.map(effect=>({...effect})),qualityId:'BASE',behaviorFamilyId:null,activationLimit:{scope:'HAND',count:1},growthRules,caps:{},runtimeDefaults,runtimeScopes,subAffixRules:{schemaVersion:2,slotCount:2,defaultUnlockedCount:0,unlockCosts:[...affixUnlockCosts],poolIds:subAffixPool.filter(item=>item.personaId===personaId).map(item=>item.id),allowDuplicates:false,maxAttributeCount:3,maxSubAttributeCount:2,poolSize:5},tags:['基础人格'],decisionStatus,tone:tones[index],portrait:`assets/art/${portraits[index]}`}
  });
  modules.basePersonas={version:3,attributeSchemaVersion:2,entries,mainAttributes,subAffixPool,templates,defaultLoadoutIds:['observer','wanderer','pathfinder','restraint']};
})(globalThis);
