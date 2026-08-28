(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  modules.encounters=[
    {id:'DEMO_ENCOUNTER_01',bossProfileId:'DEMO_BOSS_PROFILE_01',interventionProfileId:'DEMO_INTERVENTION_PROFILE_01'},
    {id:'DEMO_ENCOUNTER_02',bossProfileId:'DEMO_BOSS_PROFILE_02',interventionProfileId:'DEMO_INTERVENTION_PROFILE_02'},
    {id:'REFERENCE_ENCOUNTER_LATE',bossProfileId:'DEMO_BOSS_PROFILE_03',interventionProfileId:'DEMO_INTERVENTION_PROFILE_03',referenceOnly:true}
  ];
})(globalThis);
