(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const common={qualityId:'BASE',behaviorFamilyId:null,activationLimit:{scope:'HAND',count:1},growthRules:[],caps:{},runtimeDefaults:{activationCountThisBattle:0},runtimeScopes:{activationCountThisBattle:'BATTLE'},tags:['基础人格']};
  modules.basePersonas={
    templates:[
      {...common,id:'observer',mode:'映照',name:'终局观察者',code:'PERSONA_01',conditions:[{type:'HAND_HAS_STRAIGHT'}],effects:[{type:'ADD_CHIPS',value:45,phase:'PERSONA_ADDITIVE'}],tone:'#54445f',portrait:'assets/art/persona-observer-v1.webp'},
      {...common,id:'wanderer',mode:'偏转',name:'花色漫游者',code:'PERSONA_02',conditions:[{type:'MIN_UNIQUE_SUITS',value:2}],effects:[{type:'ADD_MULT',value:2,phase:'PERSONA_ADDITIVE'}],tone:'#797284',portrait:'assets/art/persona-wanderer-v1.webp'},
      {...common,id:'pathfinder',mode:'裂变',name:'险境寻路者',code:'PERSONA_03',conditions:[{type:'SUBMITTED_CARD_COUNT_EXACT',value:2}],effects:[{type:'MULTIPLY_FINAL',value:1.5,phase:'PERSONA_FINAL'}],tone:'#7f787f',portrait:'assets/art/persona-pathfinder-v1.webp'},
      {...common,id:'restraint',mode:'映照',name:'克制的赌徒',code:'PERSONA_04',conditions:[{type:'SUBMITTED_CARD_COUNT_EXACT',value:1}],effects:[{type:'ADD_CHIPS',value:35,phase:'PERSONA_ADDITIVE'}],tone:'#48414f',portrait:'assets/art/persona-restraint-v1.webp'},
      {...common,id:'collector',mode:'映照',name:'结构收藏家',code:'PERSONA_05',conditions:[{type:'HAS_MATCHED_RANK_STRUCTURE'}],effects:[{type:'ADD_CHIPS',value:25,phase:'PERSONA_ADDITIVE'}],tone:'#654857',portrait:'assets/art/persona-collector-v1.webp'},
      {...common,id:'resonance',mode:'偏转',name:'同色共鸣者',code:'PERSONA_06',conditions:[{type:'HAND_HAS_FLUSH'}],effects:[{type:'ADD_MULT',value:3,phase:'PERSONA_ADDITIVE'}],tone:'#3e5868',portrait:'assets/art/persona-resonance-v1.webp'},
      {...common,id:'commitment',mode:'偏转',name:'满手承诺者',code:'PERSONA_07',conditions:[{type:'SUBMITTED_CARD_COUNT_EXACT',value:5}],effects:[{type:'ADD_CHIPS',value:40,phase:'PERSONA_ADDITIVE'}],tone:'#6b5947',portrait:'assets/art/persona-commitment-v1.webp'},
      {...common,id:'purger',mode:'裂变',name:'断舍离者',code:'PERSONA_08',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'charged',value:true}],effects:[{type:'ADD_MULT',value:3,phase:'PERSONA_ADDITIVE'},{type:'CLEAR_RUNTIME_FLAG',key:'charged',phase:'POST_COMMIT'}],growthRules:[{event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:4}],effects:[{type:'SET_RUNTIME_FLAG',key:'charged',value:true}]}],runtimeDefaults:{activationCountThisBattle:0,charged:false},runtimeScopes:{activationCountThisBattle:'BATTLE',charged:'BATTLE'},tone:'#4d3e61',portrait:'assets/art/persona-purger-v1.webp'}
    ],
    defaultLoadoutIds:['observer','wanderer','pathfinder','restraint']
  };
})(globalThis);
