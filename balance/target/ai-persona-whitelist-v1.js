(function(root){
  'use strict';
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const directions={bridge:'AI_DIRECTION_BRIDGE',break:'AI_DIRECTION_BREAK',follow:'AI_DIRECTION_FOLLOW'};
  const allDirections=[directions.bridge,directions.break,directions.follow];
  const bridgeBreak=[directions.bridge,directions.break];
  const strengthTierIds=['AI_VALUE_050','AI_VALUE_100','AI_VALUE_150','AI_VALUE_200','AI_VALUE_250','AI_VALUE_300','AI_VALUE_MULT_1','AI_VALUE_350','AI_VALUE_400','AI_VALUE_450','AI_VALUE_500'];
  const aiSubAffixes=modules.targetAiPersonaSubAffixes;

  modules.targetAiPersonaWhitelist={
    id:'TARGET_AI_PERSONA_WHITELIST_V1',
    schemaVersion:1,
    runtimeEnabled:true,
    activationMode:'LOCAL_V1',
    decisionStatus:'PROTOTYPE_ASSUMPTION',
    purpose:'新正式局由本地白名单生成安全人格；未来 AI 只能从本地已批准候选中返回一个 ID。',
    temporaryNaming:{prefix:'AI人格',sequenceStart:1,minDigits:3,displayOnly:true},
    directions:[
      {id:directions.bridge,playerFacing:false,description:'保留部分现有打法，同时连接另一条可用路线。'},
      {id:directions.break,playerFacing:false,description:'提供不依赖当前主路线的可触发解法。'},
      {id:directions.follow,playerFacing:false,description:'围绕已经稳定形成的主要打法继续强化。'}
    ],
    mechanismFamilies:[
      {id:'AI_FAMILY_SPECIALIZATION',playerFacing:false,description:'围绕牌型、张数、花色或点数形成稳定专精。'},
      {id:'AI_FAMILY_ALTERNATION',playerFacing:false,description:'通过前后手变化形成递进或交替。'},
      {id:'AI_FAMILY_COLLECTION',playerFacing:false,description:'通过首次发现不同结构积累成长。'},
      {id:'AI_FAMILY_CHARGE',playerFacing:false,description:'先完成准备动作，再在后续出牌兑现。'},
      {id:'AI_FAMILY_RESOURCE',playerFacing:false,description:'围绕出牌、弃牌和行动时机取舍。'},
      {id:'AI_FAMILY_COMBINATION',playerFacing:false,description:'同时满足牌型、花色、点数等复合条件。'}
    ],
    nodePolicies:[
      {id:'AI_NODE_POLICY_N04',runtimeNodeId:'N04',afterBattleNumber:3,directionMode:'RANDOM_SWAP_WITHOUT_REPLACEMENT',swapGroupId:'AI_DIRECTION_SWAP_EARLY',directionIds:bridgeBreak,persistScope:'RUN_STATE',playerFacing:false},
      {id:'AI_NODE_POLICY_N08',runtimeNodeId:'N08',afterBattleNumber:6,directionMode:'RANDOM_SWAP_WITHOUT_REPLACEMENT',swapGroupId:'AI_DIRECTION_SWAP_EARLY',directionIds:bridgeBreak,persistScope:'RUN_STATE',playerFacing:false},
      {id:'AI_NODE_POLICY_N12',runtimeNodeId:'N12',afterBattleNumber:9,directionMode:'FIXED',directionIds:[directions.follow],persistScope:'RUN_STATE',playerFacing:false}
    ],
    assemblyRules:{
      generatedCardCountPerNode:1,
      allowReroll:false,
      requireGrowthPart:true,
      triggerPartCount:1,
      mainEffectPartCount:1,
      growthPartCount:1,
      activationLimit:{scope:'HAND',count:1},
      mainAttributeTypeByEffect:{ADD_CHIPS:'BASE_CHIPS',ADD_MULT:'BASE_MULT',ADD_XMULT_RATE:'XMULT_RATE',MULTIPLY_FINAL:'XMULT_RATE'},
      effectPhaseByType:{ADD_CHIPS:'PERSONA_ADDITIVE',ADD_MULT:'PERSONA_ADDITIVE',ADD_XMULT_RATE:'PERSONA_ADDITIVE',MULTIPLY_FINAL:'PERSONA_FINAL'},
      growthEffectTypeByMainEffect:{ADD_CHIPS:'ADD_CHIPS',ADD_MULT:'ADD_MULT',ADD_XMULT_RATE:'ADD_XMULT_RATE',MULTIPLY_FINAL:'ADD_XMULT_RATE'},
      mechanismFingerprintFields:['mechanismFamilyId','triggerPartId','triggerVariantId','resolvedConditions','mainEffectPartId','baseStrengthTierId','growthPartId','growthConditions','growthStrengthTierId','growthCap','behaviorTags'],
      directionAssignmentStateKey:'aiPersonaDirectionByNode',
      localFallbackRequired:true,
      aiMayReturnOnlyIds:true
    },
    affixPolicy:{
      id:'AI_AFFIX_POLICY_V1',
      schemaVersion:2,
      slotCount:2,
      defaultUnlockedCount:0,
      unlockCosts:[...modules.targetEconomy.personaAffixes.unlockCosts],
      poolIds:(aiSubAffixes?.entries||[]).map(item=>item.id),
      slotPoolIds:Object.fromEntries((aiSubAffixes?.slotPools||[]).map(pool=>[pool.slotIndex,[...pool.entryIds]])),
      disallowSameAttributeType:aiSubAffixes?.disallowSameAttributeType===true,
      allowDuplicates:false,
      candidatePoolStatus:'CONFIRMED',
      runtimeEnabled:true
    },
    valueAnchor:{
      sourceShopItemId:'SHOP_SERVICE_006',
      units:{ADD_CHIPS:10,ADD_MULT:.3,ADD_XMULT_RATE:.1,MULTIPLY_FINAL_DELTA:.1},
      sourceStatus:'CONFIRMED_EXISTING_RUNTIME',
      tuningStatus:'PROTOTYPE_ASSUMPTION'
    },
    strengthTiers:[
      {id:'AI_VALUE_050',units:.5,values:{ADD_CHIPS:5,ADD_MULT:.15,ADD_XMULT_RATE:.05,MULTIPLY_FINAL:1.05}},
      {id:'AI_VALUE_100',units:1,values:{ADD_CHIPS:10,ADD_MULT:.3,ADD_XMULT_RATE:.1,MULTIPLY_FINAL:1.1}},
      {id:'AI_VALUE_150',units:1.5,values:{ADD_CHIPS:15,ADD_MULT:.45,ADD_XMULT_RATE:.15,MULTIPLY_FINAL:1.15}},
      {id:'AI_VALUE_200',units:2,values:{ADD_CHIPS:20,ADD_MULT:.6,ADD_XMULT_RATE:.2,MULTIPLY_FINAL:1.2}},
      {id:'AI_VALUE_250',units:2.5,values:{ADD_CHIPS:25,ADD_MULT:.75,ADD_XMULT_RATE:.25,MULTIPLY_FINAL:1.25}},
      {id:'AI_VALUE_300',units:3,values:{ADD_CHIPS:30,ADD_MULT:.9,ADD_XMULT_RATE:.3,MULTIPLY_FINAL:1.3}},
      {id:'AI_VALUE_MULT_1',units:10/3,values:{ADD_CHIPS:100/3,ADD_MULT:1,ADD_XMULT_RATE:1/3,MULTIPLY_FINAL:4/3}},
      {id:'AI_VALUE_350',units:3.5,values:{ADD_CHIPS:35,ADD_MULT:1.05,ADD_XMULT_RATE:.35,MULTIPLY_FINAL:1.35}},
      {id:'AI_VALUE_400',units:4,values:{ADD_CHIPS:40,ADD_MULT:1.2,ADD_XMULT_RATE:.4,MULTIPLY_FINAL:1.4}},
      {id:'AI_VALUE_450',units:4.5,values:{ADD_CHIPS:45,ADD_MULT:1.35,ADD_XMULT_RATE:.45,MULTIPLY_FINAL:1.45}},
      {id:'AI_VALUE_500',units:5,values:{ADD_CHIPS:50,ADD_MULT:1.5,ADD_XMULT_RATE:.5,MULTIPLY_FINAL:1.5}}
    ],
    frequencyBands:[
      {id:'AI_FREQ_VERY_HIGH',estimatedTriggerRate:.75,allowedBaseTierIds:strengthTierIds,tuningStatus:'PROTOTYPE_ASSUMPTION'},
      {id:'AI_FREQ_HIGH',estimatedTriggerRate:.5,allowedBaseTierIds:strengthTierIds,tuningStatus:'PROTOTYPE_ASSUMPTION'},
      {id:'AI_FREQ_MEDIUM',estimatedTriggerRate:.4,allowedBaseTierIds:strengthTierIds,tuningStatus:'PROTOTYPE_ASSUMPTION'},
      {id:'AI_FREQ_LOW',estimatedTriggerRate:.25,allowedBaseTierIds:strengthTierIds,tuningStatus:'PROTOTYPE_ASSUMPTION'},
      {id:'AI_FREQ_RARE',estimatedTriggerRate:.15,allowedBaseTierIds:strengthTierIds,tuningStatus:'PROTOTYPE_ASSUMPTION'}
    ],
    triggerParts:[
      {id:'AI_TRIGGER_SUBMITTED_AT_LEAST',directions:allDirections,behaviorTags:['CARD_COUNT','WIDE_PLAY'],copyTemplate:'打出至少 {value} 张牌',variants:[
        {id:'AI_TRIGGER_SUBMITTED_AT_LEAST_3',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_LEAST',value:3}],frequencyBandId:'AI_FREQ_HIGH'},
        {id:'AI_TRIGGER_SUBMITTED_AT_LEAST_4',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_LEAST',value:4}],frequencyBandId:'AI_FREQ_MEDIUM'},
        {id:'AI_TRIGGER_SUBMITTED_AT_LEAST_5',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_LEAST',value:5}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_SUBMITTED_AT_MOST',directions:bridgeBreak,behaviorTags:['CARD_COUNT','LEAN_PLAY'],copyTemplate:'打出不超过 {value} 张牌',variants:[
        {id:'AI_TRIGGER_SUBMITTED_AT_MOST_2',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_MOST',value:2}],frequencyBandId:'AI_FREQ_LOW'},
        {id:'AI_TRIGGER_SUBMITTED_AT_MOST_3',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_MOST',value:3}],frequencyBandId:'AI_FREQ_MEDIUM'},
        {id:'AI_TRIGGER_SUBMITTED_AT_MOST_4',conditions:[{type:'SUBMITTED_CARD_COUNT_AT_MOST',value:4}],frequencyBandId:'AI_FREQ_HIGH'}]},
      {id:'AI_TRIGGER_SUBMITTED_EXACT',directions:allDirections,behaviorTags:['CARD_COUNT','EXACT_COUNT'],copyTemplate:'恰好打出 {value} 张牌',variants:[
        {id:'AI_TRIGGER_SUBMITTED_EXACT_1',conditions:[{type:'SUBMITTED_CARD_COUNT_EXACT',value:1}],frequencyBandId:'AI_FREQ_RARE'},
        {id:'AI_TRIGGER_SUBMITTED_EXACT_2',conditions:[{type:'SUBMITTED_CARD_COUNT_EXACT',value:2}],frequencyBandId:'AI_FREQ_LOW'},
        {id:'AI_TRIGGER_SUBMITTED_EXACT_3',conditions:[{type:'SUBMITTED_CARD_COUNT_EXACT',value:3}],frequencyBandId:'AI_FREQ_MEDIUM'},
        {id:'AI_TRIGGER_SUBMITTED_EXACT_4',conditions:[{type:'SUBMITTED_CARD_COUNT_EXACT',value:4}],frequencyBandId:'AI_FREQ_MEDIUM'},
        {id:'AI_TRIGGER_SUBMITTED_EXACT_5',conditions:[{type:'SUBMITTED_CARD_COUNT_EXACT',value:5}],frequencyBandId:'AI_FREQ_HIGH'}]},
      {id:'AI_TRIGGER_SCORING_AT_LEAST',directions:allDirections,behaviorTags:['SCORING_CARD_COUNT'],copyTemplate:'本次计分牌达到 {value} 张',variants:[
        {id:'AI_TRIGGER_SCORING_AT_LEAST_2',conditions:[{type:'SCORING_CARD_COUNT_AT_LEAST',value:2}],frequencyBandId:'AI_FREQ_HIGH'},
        {id:'AI_TRIGGER_SCORING_AT_LEAST_3',conditions:[{type:'SCORING_CARD_COUNT_AT_LEAST',value:3}],frequencyBandId:'AI_FREQ_MEDIUM'},
        {id:'AI_TRIGGER_SCORING_AT_LEAST_4',conditions:[{type:'SCORING_CARD_COUNT_AT_LEAST',value:4}],frequencyBandId:'AI_FREQ_LOW'},
        {id:'AI_TRIGGER_SCORING_AT_LEAST_5',conditions:[{type:'SCORING_CARD_COUNT_AT_LEAST',value:5}],frequencyBandId:'AI_FREQ_RARE'}]},
      {id:'AI_TRIGGER_HAND_SIZE_BELOW',directions:bridgeBreak,behaviorTags:['HAND_SIZE','RISK'],copyTemplate:'当前手牌少于 {value} 张',variants:[
        {id:'AI_TRIGGER_HAND_SIZE_BELOW_4',conditions:[{type:'CURRENT_HAND_CARD_COUNT_BELOW',value:4}],frequencyBandId:'AI_FREQ_LOW'},
        {id:'AI_TRIGGER_HAND_SIZE_BELOW_6',conditions:[{type:'CURRENT_HAND_CARD_COUNT_BELOW',value:6}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_HAND_PRIORITY',directions:allDirections,behaviorTags:['HAND_QUALITY','HAND_TYPE'],copyTemplate:'打出 {resolvedHandTypeName} 或更高牌型',variants:[
        {id:'AI_TRIGGER_HAND_PRIORITY_2',conditions:[{type:'HAND_PRIORITY_AT_LEAST',value:2}],frequencyBandId:'AI_FREQ_HIGH'},
        {id:'AI_TRIGGER_HAND_PRIORITY_4',conditions:[{type:'HAND_PRIORITY_AT_LEAST',value:4}],frequencyBandId:'AI_FREQ_MEDIUM'},
        {id:'AI_TRIGGER_HAND_PRIORITY_6',conditions:[{type:'HAND_PRIORITY_AT_LEAST',value:6}],frequencyBandId:'AI_FREQ_LOW'},
        {id:'AI_TRIGGER_HAND_PRIORITY_9',conditions:[{type:'HAND_PRIORITY_AT_LEAST',value:9}],frequencyBandId:'AI_FREQ_RARE'}]},
      {id:'AI_TRIGGER_NORMAL_HAND',directions:bridgeBreak,behaviorTags:['HAND_QUALITY','NORMAL'],copyTemplate:'打出普通牌型',variants:[
        {id:'AI_TRIGGER_NORMAL_HAND_FIXED',conditions:[{type:'HAND_QUALITY_IS',value:'NORMAL'}],frequencyBandId:'AI_FREQ_VERY_HIGH'}]},
      {id:'AI_TRIGGER_RARE_HAND',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_QUALITY','RARE'],copyTemplate:'打出稀有牌型',variants:[
        {id:'AI_TRIGGER_RARE_HAND_FIXED',conditions:[{type:'HAND_QUALITY_IS',value:'RARE'}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_DOMINANT_HAND_TYPE',directions:[directions.follow],behaviorTags:['HAND_TYPE','DOMINANT_STYLE'],copyTemplate:'打出 {resolvedHandTypeName}',variants:[
        {id:'AI_TRIGGER_DOMINANT_HAND_TYPE_DYNAMIC',conditions:[{type:'HAND_TYPE_IS',valueSource:'BEHAVIOR_DOMINANT_HAND_TYPE'}],frequencyBandId:'AI_FREQ_HIGH'}]},
      {id:'AI_TRIGGER_SECONDARY_HAND_TYPE',directions:[directions.bridge],behaviorTags:['HAND_TYPE','SECONDARY_STYLE'],copyTemplate:'打出 {resolvedHandTypeName}',variants:[
        {id:'AI_TRIGGER_SECONDARY_HAND_TYPE_DYNAMIC',conditions:[{type:'HAND_TYPE_IS',valueSource:'BEHAVIOR_SECONDARY_HAND_TYPE'}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_TOP_TWO_HAND_TYPES',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_TYPE','STYLE_SET'],copyTemplate:'打出 {resolvedHandTypeNames}',variants:[
        {id:'AI_TRIGGER_TOP_TWO_HAND_TYPES_DYNAMIC',conditions:[{type:'HAND_TYPE_IN',valuesSource:'BEHAVIOR_TOP_TWO_HAND_TYPES'}],frequencyBandId:'AI_FREQ_HIGH'}]},
      {id:'AI_TRIGGER_SAME_HAND_STREAK',directions:[directions.follow],behaviorTags:['HAND_HISTORY','REPEAT'],copyTemplate:'连续第 {value} 次打出相同牌型',variants:[
        {id:'AI_TRIGGER_SAME_HAND_STREAK_2',conditions:[{type:'SAME_HAND_TYPE_STREAK_AT_LEAST',value:2}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_DIFFERENT_HAND',directions:[directions.bridge,directions.break],behaviorTags:['HAND_HISTORY','VARIETY'],copyTemplate:'打出与上一手不同的牌型',variants:[
        {id:'AI_TRIGGER_DIFFERENT_HAND_FIXED',conditions:[{type:'DIFFERENT_FROM_PREVIOUS_HAND'}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_FIRST_UNIQUE_HAND',directions:[directions.bridge,directions.break],behaviorTags:['HAND_HISTORY','DISCOVERY'],copyTemplate:'本局首次打出一种牌型',variants:[
        {id:'AI_TRIGGER_FIRST_UNIQUE_HAND_FIXED',conditions:[{type:'UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN'}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_STRAIGHT',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_STRUCTURE','STRAIGHT'],copyTemplate:'打出顺子或同花顺',variants:[
        {id:'AI_TRIGGER_STRAIGHT_FIXED',conditions:[{type:'HAND_HAS_STRAIGHT'}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_UNIQUE_SUITS',directions:[directions.bridge,directions.break],behaviorTags:['SUIT','DIVERSITY'],copyTemplate:'一手牌包含至少 {value} 种花色',variants:[
        {id:'AI_TRIGGER_UNIQUE_SUITS_2',conditions:[{type:'MIN_UNIQUE_SUITS',value:2}],frequencyBandId:'AI_FREQ_HIGH'},
        {id:'AI_TRIGGER_UNIQUE_SUITS_3',conditions:[{type:'MIN_UNIQUE_SUITS',value:3}],frequencyBandId:'AI_FREQ_MEDIUM'},
        {id:'AI_TRIGGER_UNIQUE_SUITS_4',conditions:[{type:'MIN_UNIQUE_SUITS',value:4}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_MATCHED_RANKS',directions:allDirections,behaviorTags:['HAND_STRUCTURE','MATCHED_RANKS'],copyTemplate:'打出对子或更高的同点数牌型',variants:[
        {id:'AI_TRIGGER_MATCHED_RANKS_FIXED',conditions:[{type:'HAS_MATCHED_RANK_STRUCTURE'}],frequencyBandId:'AI_FREQ_HIGH'}]},
      {id:'AI_TRIGGER_FLUSH',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_STRUCTURE','FLUSH'],copyTemplate:'打出同花或同花顺',variants:[
        {id:'AI_TRIGGER_FLUSH_FIXED',conditions:[{type:'HAND_HAS_FLUSH'}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_NEXT_PLAY_AFTER_DISCARD',mechanismFamilyId:'AI_FAMILY_CHARGE',directions:[directions.bridge,directions.break],behaviorTags:['DISCARD','CHARGE','STATE_CONSUMING'],copyTemplate:'一次弃掉至少 {value} 张牌后的下一手',variants:[
        {id:'AI_TRIGGER_NEXT_PLAY_AFTER_DISCARD_1',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'charged',value:true}],frequencyBandId:'AI_FREQ_HIGH',support:{runtimeDefaults:{charged:false},runtimeScopes:{charged:'BATTLE'},rules:[{event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:1}],effects:[{type:'SET_RUNTIME_FLAG',key:'charged',value:true}]}],onTriggerEffects:[{type:'CLEAR_RUNTIME_FLAG',key:'charged'}]}},
        {id:'AI_TRIGGER_NEXT_PLAY_AFTER_DISCARD_2',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'charged',value:true}],frequencyBandId:'AI_FREQ_MEDIUM',support:{runtimeDefaults:{charged:false},runtimeScopes:{charged:'BATTLE'},rules:[{event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:2}],effects:[{type:'SET_RUNTIME_FLAG',key:'charged',value:true}]}],onTriggerEffects:[{type:'CLEAR_RUNTIME_FLAG',key:'charged'}]}},
        {id:'AI_TRIGGER_NEXT_PLAY_AFTER_DISCARD_3',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'charged',value:true}],frequencyBandId:'AI_FREQ_LOW',support:{runtimeDefaults:{charged:false},runtimeScopes:{charged:'BATTLE'},rules:[{event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:3}],effects:[{type:'SET_RUNTIME_FLAG',key:'charged',value:true}]}],onTriggerEffects:[{type:'CLEAR_RUNTIME_FLAG',key:'charged'}]}}]},
      {id:'AI_TRIGGER_NO_DISCARD_SINCE_PLAY',directions:[directions.bridge,directions.follow],behaviorTags:['DISCARD','PRESERVATION'],copyTemplate:'上一手出牌后没有弃过牌',variants:[
        {id:'AI_TRIGGER_NO_DISCARD_SINCE_PLAY_FIXED',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'discardedSinceLastPlay',value:false}],frequencyBandId:'AI_FREQ_HIGH',support:{runtimeDefaults:{discardedSinceLastPlay:false},runtimeScopes:{discardedSinceLastPlay:'BATTLE'},rules:[{event:'DISCARD_COMMITTED',conditions:[],effects:[{type:'SET_RUNTIME_FLAG',key:'discardedSinceLastPlay',value:true}]},{event:'HAND_COMMITTED',conditions:[],effects:[{type:'SET_RUNTIME_FLAG',key:'discardedSinceLastPlay',value:false}]}],onTriggerEffects:[]}}]},
      {id:'AI_TRIGGER_DOMINANT_HAND_EXACT',mechanismFamilyId:'AI_FAMILY_SPECIALIZATION',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_TYPE','CARD_COUNT','EXACT_COUNT','DOMINANT_STYLE'],copyTemplate:'打出 {resolvedHandTypeName}，且恰好使用 {value} 张牌',variants:[
        {id:'AI_TRIGGER_DOMINANT_HAND_EXACT_DYNAMIC',conditions:[{type:'HAND_TYPE_IS',valueSource:'BEHAVIOR_DOMINANT_HAND_TYPE'},{type:'SUBMITTED_CARD_COUNT_EXACT',valueSource:'BEHAVIOR_DOMINANT_SUBMITTED_COUNT'}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_SCORING_DOMINANT_SUIT_3',mechanismFamilyId:'AI_FAMILY_SPECIALIZATION',directions:[directions.bridge,directions.follow],behaviorTags:['SUIT','DOMINANT_STYLE','SCORING_CARDS'],copyTemplate:'计分牌中至少有 3 张 {resolvedSuitName}',variants:[
        {id:'AI_TRIGGER_SCORING_DOMINANT_SUIT_3_DYNAMIC',conditions:[{type:'SCORING_SUIT_COUNT_AT_LEAST',suitSource:'BEHAVIOR_DOMINANT_SUIT',value:3}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_DOMINANT_RANK_BAND',mechanismFamilyId:'AI_FAMILY_SPECIALIZATION',directions:[directions.bridge,directions.break],behaviorTags:['RANK_BAND','SCORING_CARDS'],copyTemplate:'所有计分牌均为 {resolvedRankBandName}',variants:[
        {id:'AI_TRIGGER_DOMINANT_RANK_BAND_DYNAMIC',conditions:[{type:'ALL_SCORING_CARDS_IN_RANK_BAND',valueSource:'BEHAVIOR_DOMINANT_RANK_BAND'}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_PRIORITY_HIGHER_THAN_PREVIOUS',mechanismFamilyId:'AI_FAMILY_ALTERNATION',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_HISTORY','HAND_QUALITY','PROGRESSION'],copyTemplate:'打出比上一手更高等级的牌型',variants:[
        {id:'AI_TRIGGER_PRIORITY_HIGHER_THAN_PREVIOUS_FIXED',conditions:[{type:'HAND_PRIORITY_HIGHER_THAN_PREVIOUS'}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_NO_DISCARD_THIS_BATTLE',mechanismFamilyId:'AI_FAMILY_RESOURCE',directions:[directions.bridge,directions.break],behaviorTags:['DISCARD','PRESERVATION','BATTLE_STATE'],copyTemplate:'本场尚未使用弃牌时出牌',variants:[
        {id:'AI_TRIGGER_NO_DISCARD_THIS_BATTLE_FIXED',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'discardedThisBattle',value:false}],frequencyBandId:'AI_FREQ_MEDIUM',support:{runtimeDefaults:{discardedThisBattle:false},runtimeScopes:{discardedThisBattle:'BATTLE'},rules:[{event:'DISCARD_COMMITTED',conditions:[],effects:[{type:'SET_RUNTIME_FLAG',key:'discardedThisBattle',value:true}]}],onTriggerEffects:[]}}]},
      {id:'AI_TRIGGER_LAST_PLAY_THIS_BATTLE',mechanismFamilyId:'AI_FAMILY_RESOURCE',directions:[directions.break,directions.follow],behaviorTags:['HANDS','RISK','BATTLE_STATE'],copyTemplate:'使用本场最后一次出牌机会',variants:[
        {id:'AI_TRIGGER_LAST_PLAY_THIS_BATTLE_FIXED',conditions:[{type:'REMAINING_HANDS_EXACT',value:1}],frequencyBandId:'AI_FREQ_RARE'}]},
      {id:'AI_TRIGGER_FIRST_PLAY_THIS_BATTLE',mechanismFamilyId:'AI_FAMILY_RESOURCE',directions:[directions.bridge,directions.break],behaviorTags:['HANDS','OPENING','BATTLE_STATE'],copyTemplate:'本场第一次出牌',variants:[
        {id:'AI_TRIGGER_FIRST_PLAY_THIS_BATTLE_FIXED',conditions:[{type:'HAND_INDEX_EXACT',value:1}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_REMAINING_DISCARDS_2',mechanismFamilyId:'AI_FAMILY_RESOURCE',directions:[directions.bridge,directions.break],behaviorTags:['DISCARD','PRESERVATION','BATTLE_STATE'],copyTemplate:'至少保留 2 次弃牌机会时出牌',variants:[
        {id:'AI_TRIGGER_REMAINING_DISCARDS_2_FIXED',conditions:[{type:'REMAINING_DISCARDS_AT_LEAST',value:2}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_DOMINANT_HAND_AND_SUIT',mechanismFamilyId:'AI_FAMILY_COMBINATION',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_TYPE','SUIT','DOMINANT_STYLE','COMBINATION'],copyTemplate:'打出 {resolvedHandTypeName}，且计分牌中至少有 3 张 {resolvedSuitName}',variants:[
        {id:'AI_TRIGGER_DOMINANT_HAND_AND_SUIT_DYNAMIC',conditions:[{type:'HAND_TYPE_IS',valueSource:'BEHAVIOR_DOMINANT_HAND_TYPE'},{type:'SCORING_SUIT_COUNT_AT_LEAST',suitSource:'BEHAVIOR_DOMINANT_SUIT',value:3}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_SCORING_SUIT_DIVERSITY_3',mechanismFamilyId:'AI_FAMILY_COMBINATION',directions:[directions.bridge,directions.break],behaviorTags:['SUIT','DIVERSITY','SCORING_CARDS','COMBINATION'],copyTemplate:'计分牌包含至少 3 种花色',variants:[
        {id:'AI_TRIGGER_SCORING_SUIT_DIVERSITY_3_FIXED',conditions:[{type:'MIN_SCORING_UNIQUE_SUITS',value:3}],frequencyBandId:'AI_FREQ_MEDIUM'}]},
      {id:'AI_TRIGGER_SECONDARY_TO_DOMINANT',mechanismFamilyId:'AI_FAMILY_ALTERNATION',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_HISTORY','HAND_TYPE','ALTERNATION'],copyTemplate:'上一手打出 {resolvedPreviousHandTypeName}，本手打出 {resolvedCurrentHandTypeName}',variants:[
        {id:'AI_TRIGGER_SECONDARY_TO_DOMINANT_DYNAMIC',conditions:[{type:'PREVIOUS_HAND_TYPE_IS',valueSource:'BEHAVIOR_SECONDARY_HAND_TYPE'},{type:'HAND_TYPE_IS',valueSource:'BEHAVIOR_DOMINANT_HAND_TYPE'}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_ALTERNATING_FLUSH_SUIT',mechanismFamilyId:'AI_FAMILY_ALTERNATION',directions:[directions.bridge,directions.break],behaviorTags:['HAND_HISTORY','FLUSH','SUIT','ALTERNATION'],copyTemplate:'连续打出同花，且本手花色与上一手不同',variants:[
        {id:'AI_TRIGGER_ALTERNATING_FLUSH_SUIT_FIXED',conditions:[{type:'HAND_HAS_FLUSH'},{type:'CURRENT_FLUSH_SUIT_DIFFERS_FROM_PREVIOUS'}],frequencyBandId:'AI_FREQ_RARE'}]},
      {id:'AI_TRIGGER_NARROW_TO_WIDE',mechanismFamilyId:'AI_FAMILY_ALTERNATION',directions:[directions.bridge,directions.break],behaviorTags:['HAND_HISTORY','CARD_COUNT','ALTERNATION'],copyTemplate:'上一手不超过 2 张牌，本手至少打出 4 张牌',variants:[
        {id:'AI_TRIGGER_NARROW_TO_WIDE_FIXED',conditions:[{type:'PREVIOUS_SUBMITTED_CARD_COUNT_AT_MOST',value:2},{type:'SUBMITTED_CARD_COUNT_AT_LEAST',value:4}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_PERSONA_NEW_HAND_TYPE',mechanismFamilyId:'AI_FAMILY_COLLECTION',directions:allDirections,behaviorTags:['COLLECTION','HAND_TYPE','DISCOVERY'],copyTemplate:'此人格首次见到当前牌型',variants:[
        {id:'AI_TRIGGER_PERSONA_NEW_HAND_TYPE_FIXED',conditions:[{type:'PERSONA_UNSEEN_HAND_TYPE'}],frequencyBandId:'AI_FREQ_LOW',support:{runtimeDefaults:{seenHandTypes:[]},runtimeScopes:{seenHandTypes:'RUN'},onTriggerEffects:[{type:'RECORD_CONTEXT_VALUES',key:'seenHandTypes',contextField:'CURRENT_HAND_TYPE'}]}}]},
      {id:'AI_TRIGGER_PERSONA_NEW_FLUSH_SUIT',mechanismFamilyId:'AI_FAMILY_COLLECTION',directions:[directions.bridge,directions.follow],behaviorTags:['COLLECTION','FLUSH','SUIT','DISCOVERY'],copyTemplate:'此人格首次见到当前同花花色',variants:[
        {id:'AI_TRIGGER_PERSONA_NEW_FLUSH_SUIT_FIXED',conditions:[{type:'HAND_HAS_FLUSH'},{type:'PERSONA_UNSEEN_FLUSH_SUIT'}],frequencyBandId:'AI_FREQ_RARE',support:{runtimeDefaults:{seenFlushSuits:[]},runtimeScopes:{seenFlushSuits:'RUN'},onTriggerEffects:[{type:'RECORD_CONTEXT_VALUES',key:'seenFlushSuits',contextField:'CURRENT_FLUSH_SUIT'}]}}]},
      {id:'AI_TRIGGER_PERSONA_NEW_MATCHED_RANK',mechanismFamilyId:'AI_FAMILY_COLLECTION',directions:allDirections,behaviorTags:['COLLECTION','MATCHED_RANKS','DISCOVERY'],copyTemplate:'此人格首次见到当前同点数组合',variants:[
        {id:'AI_TRIGGER_PERSONA_NEW_MATCHED_RANK_FIXED',conditions:[{type:'PERSONA_UNSEEN_MATCHED_RANK'}],frequencyBandId:'AI_FREQ_LOW',support:{runtimeDefaults:{seenMatchedRanks:[]},runtimeScopes:{seenMatchedRanks:'RUN'},onTriggerEffects:[{type:'RECORD_CONTEXT_VALUES',key:'seenMatchedRanks',contextField:'CURRENT_MATCHED_RANKS'}]}}]},
      {id:'AI_TRIGGER_PERSONA_NEW_STRAIGHT_HIGH',mechanismFamilyId:'AI_FAMILY_COLLECTION',directions:[directions.bridge,directions.follow],behaviorTags:['COLLECTION','STRAIGHT','DISCOVERY'],copyTemplate:'此人格首次见到当前顺子最高点数',variants:[
        {id:'AI_TRIGGER_PERSONA_NEW_STRAIGHT_HIGH_FIXED',conditions:[{type:'HAND_HAS_STRAIGHT'},{type:'PERSONA_UNSEEN_STRAIGHT_HIGH'}],frequencyBandId:'AI_FREQ_RARE',support:{runtimeDefaults:{seenStraightHighs:[]},runtimeScopes:{seenStraightHighs:'RUN'},onTriggerEffects:[{type:'RECORD_CONTEXT_VALUES',key:'seenStraightHighs',contextField:'CURRENT_STRAIGHT_HIGH'}]}}]},
      {id:'AI_TRIGGER_CHARGE_HAND_PAIR',mechanismFamilyId:'AI_FAMILY_CHARGE',directions:[directions.bridge,directions.follow],behaviorTags:['CHARGE','HAND_TYPE','STATE_CONSUMING'],copyTemplate:'先打出 {resolvedPreviousHandTypeName} 蓄力，之后打出 {resolvedCurrentHandTypeName} 兑现',variants:[
        {id:'AI_TRIGGER_CHARGE_HAND_PAIR_DYNAMIC',conditions:[{type:'HAND_TYPE_IS',valueSource:'BEHAVIOR_DOMINANT_HAND_TYPE'},{type:'PERSONA_RUNTIME_FLAG',key:'handPairCharged',value:true}],frequencyBandId:'AI_FREQ_LOW',support:{runtimeDefaults:{handPairCharged:false},runtimeScopes:{handPairCharged:'BATTLE'},rules:[{event:'HAND_COMMITTED',conditions:[{type:'HAND_TYPE_IS',valueSource:'BEHAVIOR_SECONDARY_HAND_TYPE'}],effects:[{type:'SET_RUNTIME_FLAG',key:'handPairCharged',value:true}]}],onTriggerEffects:[{type:'CLEAR_RUNTIME_FLAG',key:'handPairCharged'}]}}]},
      {id:'AI_TRIGGER_AFTER_TWO_MISSES',mechanismFamilyId:'AI_FAMILY_CHARGE',directions:[directions.bridge,directions.break],behaviorTags:['CHARGE','PATIENCE','STATE_CONSUMING'],copyTemplate:'连续两手未满足后，打出 {resolvedCurrentHandTypeName}',variants:[
        {id:'AI_TRIGGER_AFTER_TWO_MISSES_DYNAMIC',conditions:[{type:'HAND_TYPE_IS',valueSource:'BEHAVIOR_DOMINANT_HAND_TYPE'},{type:'PERSONA_RUNTIME_COUNTER_AT_LEAST',key:'consecutiveMainTriggerMisses',value:2}],frequencyBandId:'AI_FREQ_RARE',support:{runtimeDefaults:{consecutiveMainTriggerMisses:0},runtimeScopes:{consecutiveMainTriggerMisses:'BATTLE'},onTriggerEffects:[{type:'SET_RUNTIME_COUNTER',runtimeCounter:'consecutiveMainTriggerMisses',value:0}]}}]},
      {id:'AI_TRIGGER_DISCARD_SUIT_CHARGE',mechanismFamilyId:'AI_FAMILY_CHARGE',directions:[directions.bridge,directions.break],behaviorTags:['CHARGE','DISCARD','SUIT','STATE_CONSUMING'],copyTemplate:'弃过至少 1 张 {resolvedSuitName} 后，下一手计分牌包含该花色',variants:[
        {id:'AI_TRIGGER_DISCARD_SUIT_CHARGE_DYNAMIC',conditions:[{type:'PERSONA_RUNTIME_FLAG',key:'suitCharged',value:true},{type:'SCORING_SUIT_COUNT_AT_LEAST',suitSource:'BEHAVIOR_DOMINANT_SUIT',value:1}],frequencyBandId:'AI_FREQ_LOW',support:{runtimeDefaults:{suitCharged:false},runtimeScopes:{suitCharged:'BATTLE'},rules:[{event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_SUIT_COUNT_AT_LEAST',suitSource:'BEHAVIOR_DOMINANT_SUIT',value:1}],effects:[{type:'SET_RUNTIME_FLAG',key:'suitCharged',value:true}]}],onTriggerEffects:[{type:'CLEAR_RUNTIME_FLAG',key:'suitCharged'}]}}]},
      {id:'AI_TRIGGER_ALL_EVEN_RANKS',mechanismFamilyId:'AI_FAMILY_COMBINATION',directions:[directions.bridge,directions.break],behaviorTags:['RANK','COMBINATION'],copyTemplate:'所有计分牌点数均为偶数',variants:[
        {id:'AI_TRIGGER_ALL_EVEN_RANKS_FIXED',conditions:[{type:'SCORING_CARDS_ALL_EVEN'}],frequencyBandId:'AI_FREQ_LOW'}]},
      {id:'AI_TRIGGER_RANK_OVERLAP_PREVIOUS',mechanismFamilyId:'AI_FAMILY_COMBINATION',directions:[directions.bridge,directions.follow],behaviorTags:['HAND_HISTORY','RANK','COMBINATION'],copyTemplate:'本手计分牌与上一手至少有 1 个相同点数',variants:[
        {id:'AI_TRIGGER_RANK_OVERLAP_PREVIOUS_FIXED',conditions:[{type:'SCORING_RANK_OVERLAPS_PREVIOUS'}],frequencyBandId:'AI_FREQ_MEDIUM'}]}
    ],
    mainEffectParts:[
      {id:'AI_EFFECT_CHIPS',runtimeType:'ADD_CHIPS',mainAttributeType:'BASE_CHIPS',copyTemplate:'+{value} 筹码',allowedTierIds:strengthTierIds.filter(id=>id!=='AI_VALUE_MULT_1'),directions:allDirections},
      {id:'AI_EFFECT_MULT',runtimeType:'ADD_MULT',mainAttributeType:'BASE_MULT',copyTemplate:'+{value} 倍率',allowedTierIds:['AI_VALUE_MULT_1'],directions:allDirections},
      {id:'AI_EFFECT_XMULT_RATE',runtimeType:'ADD_XMULT_RATE',mainAttributeType:'XMULT_RATE',copyTemplate:'+{percentValue}% 独立倍率',allowedTierIds:strengthTierIds.filter(id=>id!=='AI_VALUE_MULT_1'),directions:allDirections},
      {id:'AI_EFFECT_FINAL_MULTIPLIER',runtimeType:'MULTIPLY_FINAL',mainAttributeType:'XMULT_RATE',copyTemplate:'最终得分提高 {percentDeltaValue}%',allowedTierIds:strengthTierIds.filter(id=>id!=='AI_VALUE_MULT_1'),directions:allDirections}
    ],
    growthParts:[
      {id:'AI_GROWTH_CORE_TRIGGER',event:'HAND_COMMITTED',conditionSource:'CORE_TRIGGER',frequencyBandSource:'CORE_TRIGGER',copyTemplate:'每次触发时，成长 1 层',runtimeEffect:{type:'ADD_GROWTH_STACK',runtimeCounter:'growthStacks',value:1},allowedCapValues:[1,2,3,4,5],allowedPerStackTierIds:['AI_VALUE_050','AI_VALUE_100','AI_VALUE_MULT_1'],incompatibleTriggerTags:['STATE_CONSUMING']},
      {id:'AI_GROWTH_FIRST_UNIQUE_HAND',event:'HAND_COMMITTED',conditions:[{type:'UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN'}],frequencyBandId:'AI_FREQ_LOW',copyTemplate:'每首次打出一种牌型，成长 1 层',runtimeEffect:{type:'ADD_GROWTH_STACK',runtimeCounter:'growthStacks',value:1},allowedCapValues:[1,2,3,4,5],allowedPerStackTierIds:['AI_VALUE_050','AI_VALUE_100','AI_VALUE_MULT_1']},
      {id:'AI_GROWTH_DIFFERENT_HAND',event:'HAND_COMMITTED',conditions:[{type:'DIFFERENT_FROM_PREVIOUS_HAND'}],frequencyBandId:'AI_FREQ_MEDIUM',copyTemplate:'每打出与上一手不同的牌型，成长 1 层',runtimeEffect:{type:'ADD_GROWTH_STACK',runtimeCounter:'growthStacks',value:1},allowedCapValues:[1,2,3,4],allowedPerStackTierIds:['AI_VALUE_050','AI_VALUE_100','AI_VALUE_MULT_1']},
      {id:'AI_GROWTH_SUIT_DIVERSITY',event:'HAND_COMMITTED',conditions:[{type:'MIN_UNIQUE_SUITS',value:3}],frequencyBandId:'AI_FREQ_MEDIUM',copyTemplate:'每打出至少 3 种花色，成长 1 层',runtimeEffect:{type:'ADD_GROWTH_STACK',runtimeCounter:'growthStacks',value:1},allowedCapValues:[1,2,3,4],allowedPerStackTierIds:['AI_VALUE_050','AI_VALUE_MULT_1']},
      {id:'AI_GROWTH_MATCHED_RANKS',event:'HAND_COMMITTED',conditions:[{type:'HAS_MATCHED_RANK_STRUCTURE'}],frequencyBandId:'AI_FREQ_HIGH',copyTemplate:'每打出同点数结构，成长 1 层',runtimeEffect:{type:'ADD_GROWTH_STACK',runtimeCounter:'growthStacks',value:1},allowedCapValues:[1,2,3,4],allowedPerStackTierIds:['AI_VALUE_050','AI_VALUE_MULT_1']},
      {id:'AI_GROWTH_DISCARD_TWO',event:'DISCARD_COMMITTED',conditions:[{type:'DISCARDED_CARD_COUNT_AT_LEAST',value:2}],frequencyBandId:'AI_FREQ_MEDIUM',copyTemplate:'每次弃掉至少 2 张牌，成长 1 层',runtimeEffect:{type:'ADD_GROWTH_STACK',runtimeCounter:'growthStacks',value:1},allowedCapValues:[1,2,3,4],allowedPerStackTierIds:['AI_VALUE_050','AI_VALUE_100','AI_VALUE_MULT_1']}
    ],
    numericBudgets:[
      {id:'AI_BUDGET_N04',runtimeNodeId:'N04',maxInitialExpectedUnitsPerHand:1.08,maxMatureExpectedUnitsPerHand:2.16,tuningStatus:'PROTOTYPE_ASSUMPTION'},
      {id:'AI_BUDGET_N08',runtimeNodeId:'N08',maxInitialExpectedUnitsPerHand:1.2,maxMatureExpectedUnitsPerHand:2.4,tuningStatus:'PROTOTYPE_ASSUMPTION'},
      {id:'AI_BUDGET_N12',runtimeNodeId:'N12',maxInitialExpectedUnitsPerHand:1.32,maxMatureExpectedUnitsPerHand:2.64,tuningStatus:'PROTOTYPE_ASSUMPTION'}
    ],
    unresolved:[
      {id:'AI_UNDECIDED_QUALITY',topic:'高品质相似人格的强度提升幅度与品质概率'},
      {id:'AI_UNDECIDED_TELEMETRY',topic:'触发频率档位和节点预算需由实测遥测校准'}
    ]
  };
})(globalThis);
