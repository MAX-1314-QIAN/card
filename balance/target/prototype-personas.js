(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const common={qualityId:'PROTOTYPE',behaviorFamilyId:null,activationLimit:{scope:'HAND',count:1},growthRules:[],caps:{},runtimeDefaults:{activationCountThisBattle:0},runtimeScopes:{activationCountThisBattle:'BATTLE'},decisionStatus:'PROTOTYPE_ONLY',tags:['目标长局','流程原型']};
  modules.targetPrototypePersonas=[
    {...common,id:'TARGET_PROTO_CHIP_ANCHOR',name:'筹码锚定者',mode:'映照',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_LEAST',value:3}],effects:[{type:'ADD_CHIPS',value:30,phase:'PERSONA_ADDITIVE'}]},
    {...common,id:'TARGET_PROTO_SUIT_ACCELERATOR',name:'花色增幅器',mode:'偏转',conditions:[{type:'MIN_UNIQUE_SUITS',value:3}],effects:[{type:'ADD_MULT',value:2.5,phase:'PERSONA_ADDITIVE'}]},
    {...common,id:'TARGET_PROTO_STRUCTURE_REWARD',name:'结构回报者',mode:'映照',conditions:[{type:'HAS_MATCHED_RANK_STRUCTURE'}],effects:[{type:'ADD_CHIPS',value:35,phase:'PERSONA_ADDITIVE'}]},
    {...common,id:'TARGET_PROTO_GROWTH_ARCHIVE',name:'牌型档案生长体',mode:'偏转',conditions:[],effects:[{type:'ADD_MULT',value:.4,phase:'PERSONA_ADDITIVE'},{type:'ADD_MULT',valuePerStack:.25,runtimeCounter:'growthStacks',phase:'PERSONA_ADDITIVE'}],growthRules:[{event:'HAND_COMMITTED',conditions:[{type:'UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN'}],effects:[{type:'ADD_GROWTH_STACK',value:1,runtimeCounter:'growthStacks'}]}],caps:{growthStacks:4},runtimeDefaults:{activationCountThisBattle:0,growthStacks:0},runtimeScopes:{activationCountThisBattle:'BATTLE',growthStacks:'RUN'}},
    {...common,id:'TARGET_PROTO_FINAL_ECHO',name:'终局回声',mode:'裂变',conditions:[{type:'SAME_HAND_TYPE_STREAK_AT_LEAST',value:2}],effects:[{type:'MULTIPLY_FINAL',value:1.35,phase:'PERSONA_FINAL'}]},
    {...common,id:'TARGET_PROTO_DISCARD_CHARGE',name:'弃置蓄能体',mode:'裂变',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'charged',value:true}],effects:[{type:'ADD_MULT',value:2,phase:'PERSONA_ADDITIVE'},{type:'CLEAR_RUNTIME_FLAG',key:'charged',phase:'POST_COMMIT'}],growthRules:[{event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:3}],effects:[{type:'SET_RUNTIME_FLAG',key:'charged',value:true}]}],runtimeDefaults:{activationCountThisBattle:0,charged:false},runtimeScopes:{activationCountThisBattle:'BATTLE',charged:'BATTLE'}}
  ];
})(globalThis);
