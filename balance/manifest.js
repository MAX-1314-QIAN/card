(function(root){
  const modules=root.PERSONA_BALANCE_MODULES;
  if(!modules)throw new Error('模块化平衡配置未加载');
  const currentScoringProfile={id:'POKER_HAND_PROFILE_CURRENT_DEMO',hands:modules.pokerHands,decisionStatus:'CONFIRMED'};
  const personaTemplates={...modules.personaTemplates,qualities:[...modules.personaTemplates.qualities,'PROTOTYPE'],templates:[...modules.personaTemplates.templates,...(modules.targetPrototypePersonas||[])],growthProfiles:[...modules.personaTemplates.growthProfiles,...(modules.targetGrowthProfiles||[])]};
  const manifest={
    configVersion:'phase-c.3-ai-persona-sub-affixes-v1',
    activeRunTemplateId:'RUN_TEMPLATE_TARGET',
    reservedRunTemplateIds:[],
    saveCompatibilityVersion:3,
    rulesetId:'TARGET_RUN_V1',
    featureFlags:modules.featureFlags,
    coreRules:modules.coreRules,
    pokerHands:modules.pokerHands,
    pokerHandProfiles:[currentScoringProfile,modules.targetScoringProfile],
    // Phase C.2: the former three-battle topology remains only as frozen source/test data.
    // Production registers the formal four-round run alone; the former 13-node topology is intentionally invalidated.
    runTemplates:[modules.targetRunTemplate],
    stageNodes:[...modules.targetStageNodes],
    encounters:[...modules.targetEncounters],
    bossProfiles:{rules:modules.bossProfiles.rules.map(item=>({...item,referenceOnly:true})),profiles:modules.bossProfiles.profiles.map(item=>({...item,referenceOnly:true}))},
    interventions:{events:modules.interventions.events.map(item=>({...item,referenceOnly:true})),profiles:modules.interventions.profiles.map(item=>({...item,referenceOnly:true}))},
    basePersonas:modules.basePersonas,
    personaTemplates,
    shop:modules.targetShop,
    stageLimits:modules.targetStageLimits,
    bossRuleSystem:modules.targetBossRuleSystem,
    aiPersonaWhitelist:modules.targetAiPersonaWhitelist,
    aiPersonaSubAffixes:modules.targetAiPersonaSubAffixes,
    target:{actionRules:modules.targetActionRules,scoringProfile:modules.targetScoringProfile,prototypePersonas:modules.targetPrototypePersonas,growthProfiles:modules.targetGrowthProfiles,runTemplate:modules.targetRunTemplate,stageLimits:modules.targetStageLimits,bossRuleSystem:modules.targetBossRuleSystem,aiPersonaWhitelist:modules.targetAiPersonaWhitelist,aiPersonaSubAffixes:modules.targetAiPersonaSubAffixes}
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
  const referenceBossProfileIds=['DEMO_BOSS_PROFILE_01','DEMO_BOSS_PROFILE_02','DEMO_BOSS_PROFILE_03'];
  const referenceInterventionProfileIds=['DEMO_INTERVENTION_PROFILE_01','DEMO_INTERVENTION_PROFILE_02','DEMO_INTERVENTION_PROFILE_03'];
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
      const condition=template.conditions[0]||{},rawEffect=template.effects.find(item=>['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL','ADD_XMULT_RATE'].includes(item.type))||{type:'ADD_CHIPS',value:0},effect=rawEffect.type==='ADD_XMULT_RATE'?{...rawEffect,type:'MULTIPLY_FINAL',value:1+rawEffect.value}:rawEffect;
      const triggerType={SUBMITTED_CARD_COUNT_EXACT:'EXACT_SUBMITTED_CARDS'}[condition.type]||condition.type;
      const discardChargeRule=(template.growthRules||[]).find(rule=>rule.event==='DISCARD_COMMITTED'&&rule.conditions?.some(item=>item.type==='DISCARDED_CARD_COUNT_AT_LEAST')),isNextPlay=condition.type==='PERSONA_RUNTIME_FLAG'&&!!discardChargeRule;
      return{id:template.id,displayId:template.displayId,mode:template.mainEntry,name:template.name,code:template.code,mainEntry:template.mainEntry,mainEffect:template.mainEffect,subAffixRules:template.subAffixRules,tags:template.tags,triggerType:isNextPlay?'NEXT_PLAY_AFTER_MIN_DISCARD':triggerType,triggerValue:isNextPlay?discardChargeRule.conditions.find(item=>item.type==='DISCARDED_CARD_COUNT_AT_LEAST').value:condition.value,effectType:effect.type,value:effect.value,duration:isNextPlay?'NEXT_PLAY':'CURRENT_HAND',target:effect.type==='ADD_CHIPS'?'SCORE_CHIPS':effect.type==='ADD_MULT'?'ADDITIVE_MULTIPLIER':'FINAL_MULTIPLIER',tone:template.tone,portrait:template.portrait};
    }),
    defaultPersonaLoadout:manifest.basePersonas.defaultLoadoutIds,
    bossRules:referenceBossProfileIds.map(profileId=>(bossProfileById.get(profileId)?.ruleIds||[]).map(id=>bossRuleById.get(id)).filter(Boolean)),
    interventions:{
      rewardProbability:referenceInterventionProfileIds.map(profileId=>interventionProfileById.get(profileId)?.kindProbability?.reward??0),
      events:manifest.interventions.events
    },
    runTemplate:activeRunTemplate,
    stageNodes:manifest.stageNodes,
    encounters:manifest.encounters
    ,personaTemplates:manifest.personaTemplates
    ,pokerHandProfiles:manifest.pokerHandProfiles
    ,shop:manifest.shop
    ,stageLimits:manifest.stageLimits
    ,bossRuleSystem:manifest.bossRuleSystem
    ,aiPersonaWhitelist:manifest.aiPersonaWhitelist
    ,aiPersonaSubAffixes:manifest.aiPersonaSubAffixes
    ,target:manifest.target
  };
  root.PERSONA_BALANCE_MANIFEST=manifest;
  root.PERSONA_BALANCE_RUNTIME_CONFIG=runtimeConfig;
})(globalThis);
