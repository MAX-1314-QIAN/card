(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const decisionStatus='PROTOTYPE_ASSUMPTION';
  const battles=[
    ['N01',550,1.2,'TARGET_ENCOUNTER_EARLY','N02',3],['N02',625,1.2,'TARGET_ENCOUNTER_EARLY','N03',3],['N03',675,1.4,'TARGET_ENCOUNTER_EARLY','N04',4],
    ['N05',775,1.3,'TARGET_ENCOUNTER_MID','N06',3],['N06',875,1.4,'TARGET_ENCOUNTER_MID','N07',3],['N07',975,1.5,'TARGET_ENCOUNTER_MID','N08',4],
    ['N09',1050,1.5,'TARGET_ENCOUNTER_LATE','N10',3],['N10',1275,1.6,'TARGET_ENCOUNTER_LATE','N11',3],['N11',1425,1.6,'TARGET_ENCOUNTER_LATE','N12',4],
    ['N13',1900,3,'TARGET_ENCOUNTER_FINAL','TARGET_RUN_REPORT',0]
  ];
  modules.targetStageNodes=[
    {id:'TARGET_PERSONA_SELECT',type:'PERSONA_LOADOUT_SELECT',encounterId:null,targetScore:null,estimatedMinutes:null,compatibilityOnly:true,decisionStatus:'DEPRECATED',transitions:[{on:'PERSONA_LOADOUT_CONFIRMED',to:'N01'}]},
    ...battles.map(([id,targetScore,estimatedMinutes,encounterId,to,victoryCoins])=>({id,type:'BATTLE',encounterId,targetScore,estimatedMinutes,victoryCoins,finalBattle:id==='N13',scoringProfileId:'POKER_HAND_PROFILE_TARGET_V1',decisionStatus,transitions:[{on:'BATTLE_WIN',to},{on:'BATTLE_LOSS',to:'TARGET_RUN_REPORT'}]})),
    {id:'N04',type:'PERSONA_GROWTH',encounterId:null,targetScore:null,estimatedMinutes:2,growthProfileId:'TARGET_GROWTH_1',shopProfileId:'AI1',decisionStatus,transitions:[{on:'PERSONA_GROWTH_COMPLETED',to:'N05'}]},
    {id:'N08',type:'PERSONA_GROWTH',encounterId:null,targetScore:null,estimatedMinutes:2,growthProfileId:'TARGET_GROWTH_2',shopProfileId:'AI2',decisionStatus,transitions:[{on:'PERSONA_GROWTH_COMPLETED',to:'N09'}]},
    {id:'N12',type:'PERSONA_GROWTH',encounterId:null,targetScore:null,estimatedMinutes:2,growthProfileId:'TARGET_GROWTH_3',shopProfileId:'AI3',decisionStatus,transitions:[{on:'PERSONA_GROWTH_COMPLETED',to:'N13'}]},
    {id:'TARGET_RUN_REPORT',type:'TARGET_REPORT',encounterId:null,targetScore:null,estimatedMinutes:null,decisionStatus:'PROTOTYPE_ONLY',transitions:[{on:'TARGET_REPORT_COMPLETED',to:'TARGET_PERSONA_CARRY_OUT'}]},
    {id:'TARGET_PERSONA_CARRY_OUT',type:'PERSONA_CARRY_OUT',encounterId:null,targetScore:null,estimatedMinutes:null,decisionStatus:'PROTOTYPE_ONLY',transitions:[{on:'PERSONA_CARRY_OUT_COMPLETED',to:'RUN_END'}]}
  ];
})(globalThis);
