(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const eventIds=['extra_chance','opening_encourage','temporary_boost','reduced_choice','opening_pressure','suit_probe'];
  modules.interventions={
    events:[
      {id:'extra_chance',kind:'reward',name:'额外机会',effectType:'DISCARD_DELTA',value:1,duration:'BATTLE',target:'DISCARDS'},
      {id:'opening_encourage',kind:'reward',name:'先手鼓励',effectType:'OPENING_CHIP_UP',value:30,duration:'FIRST_PLAY',target:'SCORE_CHIPS'},
      {id:'temporary_boost',kind:'reward',name:'临时强化',effectType:'CARD_CHIP_UP',value:20,duration:'BATTLE',target:'RANDOM_STARTING_HAND_CARD'},
      {id:'reduced_choice',kind:'penalty',name:'减少选择',effectType:'DISCARD_DELTA',value:-1,minValue:0,duration:'BATTLE',target:'DISCARDS'},
      {id:'opening_pressure',kind:'penalty',name:'先手压制',effectType:'OPENING_MULT_DOWN',value:2,minValue:1,duration:'FIRST_PLAY',target:'ADDITIVE_MULTIPLIER'},
      {id:'suit_probe',kind:'penalty',name:'花色试探',effectType:'FIRST_SUIT_SILENCE',value:0,duration:'FIRST_PLAY',target:'RANDOM_SUIT_CARD_CHIPS'}
    ],
    profiles:[
      {id:'DEMO_INTERVENTION_PROFILE_01',kindProbability:{reward:0.5,penalty:0.5},eventIds:[...eventIds]},
      {id:'DEMO_INTERVENTION_PROFILE_02',kindProbability:{reward:0.4,penalty:0.6},eventIds:[...eventIds]},
      {id:'DEMO_INTERVENTION_PROFILE_03',kindProbability:{reward:0.3,penalty:0.7},eventIds:[...eventIds]}
    ]
  };
})(globalThis);
