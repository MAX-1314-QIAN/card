(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  modules.targetActionRules={id:'TARGET_ACTION_RULES_V1',baseHands:4,baseDiscards:3,startingHandSize:8,maxSelection:5,personaSlots:4,battleReward:{perRemainingHand:1,perRemainingDiscard:1,decisionStatus:'CONFIRMED',fieldDecisionStatus:{perRemainingHand:'CONFIRMED',perRemainingDiscard:'CONFIRMED'}},decisionStatus:'PROTOTYPE_ASSUMPTION',fieldDecisionStatus:{baseHands:'PROTOTYPE_ASSUMPTION',baseDiscards:'PROTOTYPE_ASSUMPTION',startingHandSize:'PROTOTYPE_ASSUMPTION',maxSelection:'PROTOTYPE_ASSUMPTION',personaSlots:'CONFIRMED'}};
  modules.targetEncounters=[
    {id:'TARGET_ENCOUNTER_EARLY',mode:'NEUTRAL_PROTOTYPE',bossProfileId:null,interventionProfileId:null,scoringProfileId:'POKER_HAND_PROFILE_TARGET_V1',actionRulesId:'TARGET_ACTION_RULES_V1',decisionStatus:'UNDECIDED'},
    {id:'TARGET_ENCOUNTER_MID',mode:'NEUTRAL_PROTOTYPE',bossProfileId:null,interventionProfileId:null,scoringProfileId:'POKER_HAND_PROFILE_TARGET_V1',actionRulesId:'TARGET_ACTION_RULES_V1',decisionStatus:'UNDECIDED'},
    {id:'TARGET_ENCOUNTER_LATE',mode:'NEUTRAL_PROTOTYPE',bossProfileId:null,interventionProfileId:null,scoringProfileId:'POKER_HAND_PROFILE_TARGET_V1',actionRulesId:'TARGET_ACTION_RULES_V1',decisionStatus:'UNDECIDED'},
    {id:'TARGET_ENCOUNTER_FINAL',mode:'NEUTRAL_PROTOTYPE',bossProfileId:null,interventionProfileId:null,scoringProfileId:'POKER_HAND_PROFILE_TARGET_V1',actionRulesId:'TARGET_ACTION_RULES_V1',finalBattle:true,decisionStatus:'UNDECIDED'}
  ];
  const coreNodeIds=['N01','N02','N03','N04','N05','N06','N07','N08','N09','N10','N11','N12','N13','N14','N15','N16','N17'];
  modules.targetRunTemplate={id:'RUN_TEMPLATE_TARGET',runTemplateId:'RUN_TEMPLATE_TARGET',startNodeId:'N01',nodeIds:['TARGET_PERSONA_SELECT',...coreNodeIds,'TARGET_RUN_REPORT','TARGET_PERSONA_CARRY_OUT'],compatibilityNodeIds:['TARGET_PERSONA_SELECT'],coreNodeIds,endCondition:{type:'NODE_COMPLETED',nodeId:'TARGET_PERSONA_CARRY_OUT'},scoringProfileId:'POKER_HAND_PROFILE_TARGET_V1',stageLimitConfigId:'TARGET_STAGE_LIMITS_V1',actionRules:modules.targetActionRules,targetDurationMinutes:30,targetDurationDecisionStatus:'CONFIRMED',decisionStatus:'CONFIRMED',version:5,developmentOnly:false};
})(globalThis);
