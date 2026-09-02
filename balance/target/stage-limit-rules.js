(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const handTypeOptions=[
    {id:'pair',name:'对子'},{id:'two_pair',name:'两对'},{id:'three_kind',name:'三条'},
    {id:'straight',name:'顺子'},{id:'flush',name:'同花'}
  ];
  const rules=[
    {id:'LIMIT_TARGET_01',name:'目标加压',category:'SCORE',description:'本关目标分数 +100。',effect:{type:'TARGET_SCORE_DELTA',delta:100},finalSafe:true},
    {id:'LIMIT_ACTION_01',name:'出牌缩减',category:'ACTION',description:'本场出牌次数 -1，最低保留3次。',effect:{type:'STARTING_HAND_DELTA',delta:-1,floor:3},finalSafe:false},
    {id:'LIMIT_ACTION_02',name:'弃牌缩减',category:'ACTION',description:'本场弃牌次数 -1，最低保留2次。',effect:{type:'STARTING_DISCARD_DELTA',delta:-1,floor:2},finalSafe:false},
    {id:'LIMIT_ACTION_03',name:'手牌紧缩',category:'ACTION',description:'本场每次补牌最多补至7张。',effect:{type:'STARTING_HAND_SIZE_DELTA',delta:-1,floor:7},finalSafe:true},
    {id:'LIMIT_HAND_01',name:'普通牌压制',category:'HAND',description:'普通牌型的基础筹码 -10。',effect:{type:'HAND_BASE_CHIP_DELTA_ON_QUALITY',qualityId:'NORMAL',delta:-10,floor:0},finalSafe:false},
    {id:'LIMIT_HAND_02',name:'稀有牌压制',category:'HAND',description:'稀有牌型的基础筹码 -15。',effect:{type:'HAND_BASE_CHIP_DELTA_ON_QUALITY',qualityId:'RARE',delta:-15,floor:0},finalSafe:false},
    {id:'LIMIT_HAND_03',name:'重复惩罚',category:'HAND',description:'连续打出相同牌型时，从第2次起基础筹码 -15。',effect:{type:'HAND_BASE_CHIP_DELTA_ON_REPEATED_HAND_TYPE',delta:-15,floor:0},finalSafe:true},
    {id:'LIMIT_HAND_04',name:'牌型克制',category:'HAND',description:'指定牌型的基础筹码 -20。',effect:{type:'HAND_BASE_CHIP_DELTA_ON_RANDOM_HAND_TYPE',delta:-20,floor:0,options:handTypeOptions},finalSafe:true},
    {id:'LIMIT_SCORE_01',name:'大牌磨损',category:'SCORE',description:'J、Q、K、A计分时，每张牌面筹码 -2。',effect:{type:'FACE_CHIP_DELTA_FOR_RANKS',ranks:['J','Q','K','A'],delta:-2,floor:0},finalSafe:true},
    {id:'LIMIT_SCORE_02',name:'红色磨损',category:'SCORE',description:'红桃和方片计分时，每张牌面筹码 -2。',effect:{type:'FACE_CHIP_DELTA_FOR_SUITS',suits:['♥','♦'],delta:-2,floor:0},finalSafe:true},
    {id:'LIMIT_SCORE_03',name:'黑色磨损',category:'SCORE',description:'黑桃和梅花计分时，每张牌面筹码 -2。',effect:{type:'FACE_CHIP_DELTA_FOR_SUITS',suits:['♠','♣'],delta:-2,floor:0},finalSafe:false},
    {id:'LIMIT_SCORE_04',name:'倍率压制',category:'SCORE',description:'所有牌型的基础倍率 -0.5，最低为 ×1。',effect:{type:'HAND_BASE_MULT_DELTA',delta:-.5,floor:1},finalSafe:false},
    {id:'LIMIT_RESOURCE_01',name:'胜利税',category:'RESOURCE',description:'本场固定胜利金币 -1，最低为0。',effect:{type:'VICTORY_COIN_DELTA',delta:-1,floor:0},finalSafe:false},
    {id:'LIMIT_PERSONA_01',name:'人格失衡',category:'PERSONA',description:'人格提供的筹码和倍率减半。',effect:{type:'PERSONA_BONUS_FACTOR',factor:.5},finalSafe:false}
  ].map(rule=>({...rule,decisionStatus:'CONFIRMED'}));
  modules.targetStageLimits={
    id:'TARGET_STAGE_LIMITS_V1',version:2,firstRestrictedBattleNumber:4,recentRuleCooldown:2,
    rules,
    profiles:[
      {id:'TARGET_STAGE_LIMIT_MID',battleNumbers:[4,5,6],categoryWeights:{ACTION:25,HAND:30,SCORE:25,RESOURCE:10,PERSONA:10}},
      {id:'TARGET_STAGE_LIMIT_LATE',battleNumbers:[7,8,9],categoryWeights:{ACTION:25,HAND:30,SCORE:30,RESOURCE:5,PERSONA:10}},
      {id:'TARGET_STAGE_LIMIT_ENDGAME',battleNumbers:[10,11,12],categoryWeights:{ACTION:20,HAND:30,SCORE:35,RESOURCE:5,PERSONA:10}},
      {id:'TARGET_STAGE_LIMIT_FINAL',battleNumbers:[13],ruleIds:rules.filter(rule=>rule.finalSafe).map(rule=>rule.id)}
    ],
    decisionStatus:'CONFIRMED'
  };
})(globalThis);
