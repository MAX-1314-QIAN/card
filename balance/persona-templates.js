(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const baseTemplates=modules.basePersonas?.templates||[];
  modules.personaTemplates={
    qualities:['BASE','COMMON','RARE'],
    behaviorFamilies:['T01','T02','T03','T04'],
    templates:[...baseTemplates,
      {id:'TEST_SIMPLE_ADD',name:'四枚论证',qualityId:'COMMON',behaviorFamilyId:'T01',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_LEAST',value:4}],effects:[{type:'ADD_MULT',value:0.8,phase:'PERSONA_ADDITIVE'}],activationLimit:{scope:'HAND',count:1},growthRules:[],caps:{},runtimeDefaults:{activationCountThisBattle:0},tags:['测试','简单条件']},
      {id:'TEST_GROWTH_DIVERSITY',name:'异型采集者',qualityId:'RARE',behaviorFamilyId:'T02',conditions:[],effects:[{type:'ADD_MULT',valuePerStack:0.2,runtimeCounter:'growthStacks',phase:'PERSONA_ADDITIVE'}],activationLimit:{scope:'HAND',count:1},growthRules:[{event:'HAND_COMMITTED',conditions:[{type:'UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN'}],effects:[{type:'ADD_GROWTH_STACK',value:1,runtimeCounter:'growthStacks'}]}],caps:{growthStacks:4},runtimeDefaults:{growthStacks:0,activationCountThisBattle:0},tags:['测试','成长','跨战']},
      {id:'TEST_REPEAT_RARE',name:'第三重回声',qualityId:'RARE',behaviorFamilyId:'T03',conditions:[{type:'SAME_HAND_TYPE_STREAK_AT_LEAST',value:3}],effects:[{type:'MULTIPLY_FINAL',value:1.42,phase:'PERSONA_FINAL'}],activationLimit:{scope:'HAND',count:1},growthRules:[],caps:{},runtimeDefaults:{activationCountThisBattle:0},tags:['测试','独立程序','最终倍率']},
      {id:'TEST_CHARGED_RELEASE',name:'蓄势断舍离',qualityId:'RARE',behaviorFamilyId:'T04',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'charged',value:true}],effects:[{type:'ADD_MULT',value:3,phase:'PERSONA_ADDITIVE'},{type:'CLEAR_RUNTIME_FLAG',key:'charged',phase:'POST_COMMIT'}],activationLimit:{scope:'HAND',count:1},growthRules:[{event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:4}],effects:[{type:'SET_RUNTIME_FLAG',key:'charged',value:true}]}],caps:{},runtimeDefaults:{charged:false,activationCountThisBattle:0},tags:['测试','蓄力','跨操作']}
    ],
    growthProfiles:[
      {id:'SLICE_GROWTH_PROFILE_01',templateId:'TEST_GROWTH_DIVERSITY',source:'PERSONA_GROWTH_NODE',initialTemplateIds:['TEST_SIMPLE_ADD','TEST_REPEAT_RARE','TEST_CHARGED_RELEASE']}
    ]
  };
})(globalThis);
