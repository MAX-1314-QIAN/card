(function(root){
  const modules=root.PERSONA_BALANCE_MODULES;
  if(!modules)throw new Error('模块化平衡配置未加载');
  const currentScoringProfile={id:'POKER_HAND_PROFILE_CURRENT_DEMO',hands:modules.pokerHands,decisionStatus:'CONFIRMED'};
  const personaTemplates={...modules.personaTemplates,qualities:[...modules.personaTemplates.qualities,'PROTOTYPE'],templates:[...modules.personaTemplates.templates,...(modules.targetPrototypePersonas||[])],growthProfiles:[...modules.personaTemplates.growthProfiles,...(modules.targetGrowthProfiles||[])]};
  const manifest={
    configVersion:'phase-c.0',
    activeRunTemplateId:'RUN_TEMPLATE_CURRENT_DEMO',
    reservedRunTemplateIds:['RUN_TEMPLATE_TARGET'],
    saveCompatibilityVersion:2,
    rulesetId:'CURRENT_DEMO_V2_1',
    featureFlags:modules.featureFlags,
    coreRules:modules.coreRules,
    pokerHands:modules.pokerHands,
    pokerHandProfiles:[currentScoringProfile,modules.targetScoringProfile],
    runTemplates:[...modules.runTemplates,modules.targetRunTemplate],
    stageNodes:[...modules.stageNodes,...modules.targetStageNodes],
    encounters:[...modules.encounters,...modules.targetEncounters],
    bossProfiles:modules.bossProfiles,
    interventions:modules.interventions,
    basePersonas:modules.basePersonas,
    personaTemplates,
    target:{actionRules:modules.targetActionRules,scoringProfile:modules.targetScoringProfile,prototypePersonas:modules.targetPrototypePersonas,growthProfiles:modules.targetGrowthProfiles,runTemplate:modules.targetRunTemplate}
  };
  root.PERSONA_CONFIG_VALIDATOR.assertValid(manifest);

  const activeRunTemplate=manifest.runTemplates.find(item=>item.id===manifest.activeRunTemplateId);
  const nodeById=new Map(manifest.stageNodes.map(item=>[item.id,item]));
  const encounterById=new Map(manifest.encounters.map(item=>[item.id,item]));
  const bossProfileById=new Map(manifest.bossProfiles.profiles.map(item=>[item.id,item]));
  const bossRuleById=new Map(manifest.bossProfiles.rules.map(item=>[item.id,item]));
  const interventionProfileById=new Map(manifest.interventions.profiles.map(item=>[item.id,item]));
  const battleNodes=activeRunTemplate.nodeIds.map(id=>nodeById.get(id)).filter(node=>node.type==='BATTLE');
  const battleEncounters=battleNodes.map(node=>encounterById.get(node.encounterId));
  const runtimeConfig={
    meta:{
      id:'balance-v2.1',
      version:'2.1',
      authority:'当前网页 Demo 实现基线 V2.1',
      configVersion:manifest.configVersion,
      rulesetId:manifest.rulesetId,
      activeRunTemplateId:manifest.activeRunTemplateId,
      saveCompatibilityVersion:manifest.saveCompatibilityVersion
    },
    featureFlags:manifest.featureFlags,
    battle:{...manifest.coreRules,targets:battleNodes.map(node=>node.targetScore)},
    handTypes:manifest.pokerHands,
    personas:manifest.basePersonas.templates.map(template=>{
      const condition=template.conditions[0]||{},effect=template.effects.find(item=>['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL'].includes(item.type));
      const triggerType={SUBMITTED_CARD_COUNT_EXACT:'EXACT_SUBMITTED_CARDS'}[condition.type]||condition.type;
      const discardChargeRule=(template.growthRules||[]).find(rule=>rule.event==='DISCARD_COMMITTED'&&rule.conditions?.some(item=>item.type==='DISCARDED_CARD_COUNT_AT_LEAST')),isNextPlay=condition.type==='PERSONA_RUNTIME_FLAG'&&!!discardChargeRule;
      return{id:template.id,mode:template.mode,name:template.name,code:template.code,triggerType:isNextPlay?'NEXT_PLAY_AFTER_MIN_DISCARD':triggerType,triggerValue:isNextPlay?discardChargeRule.conditions.find(item=>item.type==='DISCARDED_CARD_COUNT_AT_LEAST').value:condition.value,effectType:effect.type,value:effect.value,duration:isNextPlay?'NEXT_PLAY':'CURRENT_HAND',target:effect.type==='ADD_CHIPS'?'SCORE_CHIPS':effect.type==='ADD_MULT'?'ADDITIVE_MULTIPLIER':'FINAL_MULTIPLIER',tone:template.tone,portrait:template.portrait};
    }),
    defaultPersonaLoadout:manifest.basePersonas.defaultLoadoutIds,
    bossRules:battleEncounters.map(encounter=>bossProfileById.get(encounter.bossProfileId).ruleIds.map(id=>bossRuleById.get(id))),
    interventions:{
      rewardProbability:battleEncounters.map(encounter=>interventionProfileById.get(encounter.interventionProfileId).kindProbability.reward),
      events:manifest.interventions.events
    },
    runTemplate:activeRunTemplate,
    stageNodes:manifest.stageNodes,
    encounters:manifest.encounters
    ,personaTemplates:manifest.personaTemplates
    ,pokerHandProfiles:manifest.pokerHandProfiles
    ,target:manifest.target
  };
  root.PERSONA_BALANCE_MANIFEST=manifest;
  root.PERSONA_BALANCE_RUNTIME_CONFIG=runtimeConfig;
})(globalThis);
