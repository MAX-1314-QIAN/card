(function(root){
  const PERSONA_EFFECT_TYPES=new Set(['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL']);
  const BOSS_EFFECT_TYPES=new Set(['OPENING_MULT_DOWN','FIRST_SUIT_SILENCE','DISCARD_DELTA','SUIT_SILENCE','PERSONA_DISABLE','SELECTION_LIMIT','REPEAT_FINAL_MULT','HANDS_AND_TARGET']);
  const INTERVENTION_EFFECT_TYPES=new Set(['DISCARD_DELTA','OPENING_CHIP_UP','CARD_CHIP_UP','OPENING_MULT_DOWN','FIRST_SUIT_SILENCE']);
  const PERSONA_CONDITION_TYPES=new Set(['SUBMITTED_CARD_COUNT_AT_LEAST','SUBMITTED_CARD_COUNT_EXACT','HAND_TYPE_IS','HAND_TYPE_IN','SAME_HAND_TYPE_STREAK_AT_LEAST','DISCARDED_CARD_COUNT_AT_LEAST','PERSONA_RUNTIME_FLAG','UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN','HAND_HAS_STRAIGHT','MIN_UNIQUE_SUITS','HAS_MATCHED_RANK_STRUCTURE','HAND_HAS_FLUSH']);
  const PERSONA_RUNTIME_EFFECT_TYPES=new Set(['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL','SET_RUNTIME_FLAG','CLEAR_RUNTIME_FLAG','ADD_RUNTIME_COUNTER','ADD_GROWTH_STACK']);

  function containsFunction(value,seen=new Set()){
    if(typeof value==='function')return true;
    if(!value||typeof value!=='object'||seen.has(value))return false;
    seen.add(value);
    return Object.values(value).some(child=>containsFunction(child,seen));
  }

  function validate(manifest){
    const errors=[];
    const require=(condition,message)=>{if(!condition)errors.push(message)};
    require(typeof manifest?.configVersion==='string'&&manifest.configVersion.trim().length>0,'configVersion 必须是非空字符串');
    require(Number.isInteger(manifest?.saveCompatibilityVersion)&&manifest.saveCompatibilityVersion>0,'saveCompatibilityVersion 必须是正整数');
    require(typeof manifest?.rulesetId==='string'&&manifest.rulesetId.trim().length>0,'rulesetId 必须是非空字符串');
    require(!containsFunction(manifest),'配置对象中不得包含可执行函数');

    const registries=[
      ['runTemplates',manifest?.runTemplates||[]],['stageNodes',manifest?.stageNodes||[]],['encounters',manifest?.encounters||[]],
      ['bossRules',manifest?.bossProfiles?.rules||[]],['bossProfiles',manifest?.bossProfiles?.profiles||[]],
      ['interventionEvents',manifest?.interventions?.events||[]],['interventionProfiles',manifest?.interventions?.profiles||[]],
      ['pokerHands',manifest?.pokerHands||[]],
      ['personaTemplates',manifest?.personaTemplates?.templates||[]],['personaGrowthProfiles',manifest?.personaTemplates?.growthProfiles||[]]
    ];
    const allIds=new Map();
    for(const [registry,items] of registries){
      for(const item of items){
        require(item&&typeof item.id==='string'&&item.id.length>0,`${registry} 存在无效 ID`);
        if(!item?.id)continue;
        if(allIds.has(item.id))errors.push(`配置 ID 重复：${item.id}（${allIds.get(item.id)} / ${registry}）`);
        else allIds.set(item.id,registry);
      }
    }

    const templatesById=new Map((manifest?.runTemplates||[]).map(item=>[item.id,item]));
    const nodesById=new Map((manifest?.stageNodes||[]).map(item=>[item.id,item]));
    const encountersById=new Map((manifest?.encounters||[]).map(item=>[item.id,item]));
    const bossRulesById=new Map((manifest?.bossProfiles?.rules||[]).map(item=>[item.id,item]));
    const bossProfilesById=new Map((manifest?.bossProfiles?.profiles||[]).map(item=>[item.id,item]));
    const interventionEventsById=new Map((manifest?.interventions?.events||[]).map(item=>[item.id,item]));
    const interventionProfilesById=new Map((manifest?.interventions?.profiles||[]).map(item=>[item.id,item]));
    const personaIds=new Set((manifest?.basePersonas?.templates||[]).map(item=>item.id));
    const targetPersonaTemplatesById=new Map((manifest?.personaTemplates?.templates||[]).map(item=>[item.id,item]));
    const personaGrowthProfilesById=new Map((manifest?.personaTemplates?.growthProfiles||[]).map(item=>[item.id,item]));
    const scoringProfilesById=new Map((manifest?.pokerHandProfiles||[]).map(item=>[item.id,item]));

    require(templatesById.has(manifest?.activeRunTemplateId),'activeRunTemplateId 必须引用存在的 Run Template');
    for(const template of templatesById.values()){
      require(template.runTemplateId===template.id,`${template.id} 的 runTemplateId 必须与 id 一致`);
      require(Number.isInteger(template.version)&&template.version>0,`${template.id} 的 version 必须是正整数`);
      require(nodesById.has(template.startNodeId),`${template.id} 的 startNodeId 不存在`);
      require(Array.isArray(template.nodeIds)&&template.nodeIds.length>0,`${template.id} 必须包含 nodeIds`);
      for(const nodeId of template.nodeIds||[])require(nodesById.has(nodeId),`${template.id} 引用了不存在的节点 ${nodeId}`);
      require(nodesById.has(template.endCondition?.nodeId),`${template.id} 的结束节点不存在`);
      const allowed=new Set(template.nodeIds||[]),visited=new Set(),queue=[template.startNodeId];
      while(queue.length){const id=queue.shift();if(visited.has(id)||!allowed.has(id))continue;visited.add(id);for(const transition of nodesById.get(id)?.transitions||[])if(transition.to!=='RUN_END')queue.push(transition.to)}
      for(const nodeId of allowed)require(visited.has(nodeId),`${template.id} 中存在从起点不可达的节点 ${nodeId}`);
      require(visited.has(template.endCondition?.nodeId),`${template.id} 的结束节点从起点不可达`);
    }

    const referencedNodes=new Set((manifest?.runTemplates||[]).flatMap(item=>item.nodeIds||[]));
    for(const node of nodesById.values()){
      require(referencedNodes.has(node.id),`节点 ${node.id} 未被任何 Run Template 使用`);
      require(Array.isArray(node.transitions)&&node.transitions.length>0,`节点 ${node.id} 必须包含 transitions`);
      const transitionEvents=new Set();
      for(const transition of node.transitions||[]){
        require(typeof transition?.on==='string'&&transition.on.length>0,`节点 ${node.id} 存在无效 transition 事件`);
        require(typeof transition?.to==='string'&&transition.to.length>0,`节点 ${node.id} 存在无效 transition 目标`);
        require(!transitionEvents.has(transition.on),`节点 ${node.id} 重复声明 transition ${transition.on}`);
        transitionEvents.add(transition.on);
        if(transition.to!=='RUN_END')require(nodesById.has(transition.to),`节点 ${node.id} 指向不存在的节点 ${transition.to}`);
      }
      if(node.type==='BATTLE'){
        require(encountersById.has(node.encounterId),`战斗节点 ${node.id} 的 encounterId 不存在`);
        require(Number.isFinite(node.targetScore)&&node.targetScore>0,`战斗节点 ${node.id} 的 targetScore 必须大于 0`);
      }else require(node.encounterId===null,`非战斗节点 ${node.id} 不应引用 encounterId`);
      if(node.type==='PERSONA_GROWTH')require(personaGrowthProfilesById.has(node.growthProfileId),`人格成长节点 ${node.id} 引用了不存在的 profile ${node.growthProfileId}`);
    }

    for(const profile of scoringProfilesById.values()){require(Array.isArray(profile.hands)&&profile.hands.length===9,`牌型 Profile ${profile.id} 必须包含九种牌型`);require(new Set(profile.hands.map(item=>item.id)).size===9,`牌型 Profile ${profile.id} 的牌型 ID 必须唯一`);for(const hand of profile.hands){require(Number.isFinite(hand.chips)&&Number.isFinite(hand.mult),`牌型 Profile ${profile.id}/${hand.id} 数值无效`)}}
    for(const template of templatesById.values())require(scoringProfilesById.has(template.scoringProfileId||'POKER_HAND_PROFILE_CURRENT_DEMO'),`${template.id} 的 scoringProfileId 不存在`);

    const referencedEncounters=new Set((manifest?.stageNodes||[]).filter(item=>item.type==='BATTLE').map(item=>item.encounterId));
    for(const encounter of encountersById.values()){
      require(referencedEncounters.has(encounter.id),`Encounter ${encounter.id} 未被战斗节点使用`);
      if(encounter.mode==='NEUTRAL_PROTOTYPE'){require(encounter.bossProfileId===null&&encounter.interventionProfileId===null,`Neutral Encounter ${encounter.id} 不应引用 Boss/Intervention Profile`);require(scoringProfilesById.has(encounter.scoringProfileId),`Neutral Encounter ${encounter.id} 的 scoringProfileId 不存在`)}else{require(bossProfilesById.has(encounter.bossProfileId),`Encounter ${encounter.id} 的 bossProfileId 不存在`);require(interventionProfilesById.has(encounter.interventionProfileId),`Encounter ${encounter.id} 的 interventionProfileId 不存在`)}
    }

    const usedBossProfiles=new Set((manifest?.encounters||[]).map(item=>item.bossProfileId));
    const usedBossRules=new Set((manifest?.bossProfiles?.profiles||[]).flatMap(item=>item.ruleIds||[]));
    for(const profile of bossProfilesById.values()){
      require(usedBossProfiles.has(profile.id),`Boss Profile ${profile.id} 未被 Encounter 使用`);
      require(Array.isArray(profile.ruleIds)&&profile.ruleIds.length>0,`Boss Profile ${profile.id} 必须包含 ruleIds`);
      for(const ruleId of profile.ruleIds||[])require(bossRulesById.has(ruleId),`Boss Profile ${profile.id} 引用了不存在的规则 ${ruleId}`);
    }
    for(const rule of bossRulesById.values()){
      require(usedBossRules.has(rule.id),`Boss 规则 ${rule.id} 未被任何 Boss Profile 使用`);
      require(BOSS_EFFECT_TYPES.has(rule.effectType),`Boss 规则 ${rule.id} 使用了不允许的 effectType：${rule.effectType}`);
    }

    const usedInterventionProfiles=new Set((manifest?.encounters||[]).map(item=>item.interventionProfileId));
    const usedInterventionEvents=new Set((manifest?.interventions?.profiles||[]).flatMap(item=>item.eventIds||[]));
    for(const profile of interventionProfilesById.values()){
      require(usedInterventionProfiles.has(profile.id),`Intervention Profile ${profile.id} 未被 Encounter 使用`);
      const probabilities=Object.values(profile.kindProbability||{});
      require(probabilities.length>0&&probabilities.every(value=>Number.isFinite(value)&&value>=0&&value<=1),`${profile.id} 的概率必须位于 0 到 1`);
      require(Math.abs(probabilities.reduce((sum,value)=>sum+value,0)-1)<1e-9,`${profile.id} 的概率组之和必须为 1`);
      for(const eventId of profile.eventIds||[])require(interventionEventsById.has(eventId),`${profile.id} 引用了不存在的事件 ${eventId}`);
    }
    for(const event of interventionEventsById.values()){
      require(usedInterventionEvents.has(event.id),`介入事件 ${event.id} 未被任何 Intervention Profile 使用`);
      require(INTERVENTION_EFFECT_TYPES.has(event.effectType),`介入事件 ${event.id} 使用了不允许的 effectType：${event.effectType}`);
    }
    for(const personaId of manifest?.basePersonas?.defaultLoadoutIds||[])require(personaIds.has(personaId),`默认人格装备引用不存在的 ID：${personaId}`);
    for(const baseTemplate of manifest?.basePersonas?.templates||[]){const unified=targetPersonaTemplatesById.get(baseTemplate.id);require(!!unified,`基础人格 ${baseTemplate.id} 未汇入统一 Persona Template 注册表`);require(JSON.stringify(unified)===JSON.stringify(baseTemplate),`基础人格 ${baseTemplate.id} 与统一 Persona Template 数据不一致`)}

    const qualities=new Set(manifest?.personaTemplates?.qualities||[]),families=new Set(manifest?.personaTemplates?.behaviorFamilies||[]);
    function validateCondition(condition,owner){
      require(PERSONA_CONDITION_TYPES.has(condition?.type),`${owner} 使用了不允许的 condition type：${condition?.type}`);
      if(['SUBMITTED_CARD_COUNT_AT_LEAST','SUBMITTED_CARD_COUNT_EXACT','SAME_HAND_TYPE_STREAK_AT_LEAST','DISCARDED_CARD_COUNT_AT_LEAST'].includes(condition?.type))require(Number.isFinite(condition.value),`${owner} 的条件数值必须是数字`);
      if(condition?.type==='HAND_TYPE_IN')require(Array.isArray(condition.values)&&condition.values.length>0,`${owner} 的 HAND_TYPE_IN 必须包含 values`);
      if(condition?.type==='PERSONA_RUNTIME_FLAG')require(typeof condition.key==='string'&&condition.key.length>0,`${owner} 的运行时标记必须包含 key`);
    }
    function validateEffect(effect,owner,runtimeDefaults){
      require(PERSONA_RUNTIME_EFFECT_TYPES.has(effect?.type),`${owner} 使用了不允许的 runtime effect：${effect?.type}`);
      if(['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL'].includes(effect?.type))require(Number.isFinite(effect.value)||Number.isFinite(effect.valuePerStack),`${owner} 的计分效果必须包含 value 或 valuePerStack`);
      if(['SET_RUNTIME_FLAG','CLEAR_RUNTIME_FLAG'].includes(effect?.type))require(typeof effect.key==='string'&&effect.key in runtimeDefaults,`${owner} 的标记效果必须引用 runtimeDefaults 中的 key`);
      if(['ADD_RUNTIME_COUNTER','ADD_GROWTH_STACK'].includes(effect?.type))require(typeof effect.runtimeCounter==='string'&&effect.runtimeCounter in runtimeDefaults,`${owner} 的计数效果必须引用 runtimeDefaults 中的 counter`);
    }
    for(const template of targetPersonaTemplatesById.values()){
      require(qualities.has(template.qualityId),`${template.id} 的 qualityId 不合法`);require(template.behaviorFamilyId===null||families.has(template.behaviorFamilyId),`${template.id} 的 behaviorFamilyId 不合法`);
      require(Array.isArray(template.conditions)&&Array.isArray(template.effects)&&Array.isArray(template.growthRules),`${template.id} 的 conditions/effects/growthRules 必须是数组`);
      require(template.runtimeDefaults&&typeof template.runtimeDefaults==='object'&&!Array.isArray(template.runtimeDefaults),`${template.id} 的 runtimeDefaults 必须是对象`);require(template.caps&&typeof template.caps==='object'&&!Array.isArray(template.caps),`${template.id} 的 caps 必须是对象`);
      require(!template.runtimeScopes||Object.entries(template.runtimeScopes).every(([key,scope])=>key in template.runtimeDefaults&&['HAND','BATTLE','RUN'].includes(scope)),`${template.id} 的 runtimeScopes 必须引用 runtimeDefaults 并声明合法 scope`);
      require(!template.successModifiers||(Array.isArray(template.successModifiers)&&template.successModifiers.every(item=>item.type==='REPEAT_EFFECT_ONCE'&&item.condition==='FIRST_SUCCESSFUL_TRIGGER_THIS_BATTLE'&&item.runtimeKey in template.runtimeDefaults)),`${template.id} 的 successModifiers 不合法`);
      require(['HAND','BATTLE','RUN'].includes(template.activationLimit?.scope)&&Number.isInteger(template.activationLimit?.count)&&template.activationLimit.count>0,`${template.id} 的 activationLimit 不合法`);
      for(const condition of template.conditions||[])validateCondition(condition,template.id);for(const effect of template.effects||[])validateEffect(effect,template.id,template.runtimeDefaults||{});
      for(const rule of template.growthRules||[]){require(['HAND_COMMITTED','DISCARD_COMMITTED'].includes(rule.event),`${template.id} 的 growth event 不合法`);for(const condition of rule.conditions||[])validateCondition(condition,template.id);for(const effect of rule.effects||[])validateEffect(effect,template.id,template.runtimeDefaults||{})}
      for(const [key,value] of Object.entries(template.caps||{})){require(key in(template.runtimeDefaults||{}),`${template.id} 的 cap ${key} 未在 runtimeDefaults 声明`);require(Number.isFinite(value),`${template.id} 的 cap ${key} 必须是数字`)}
    }
    for(const profile of personaGrowthProfilesById.values()){require(targetPersonaTemplatesById.has(profile.templateId),`${profile.id} 引用不存在的人格模板 ${profile.templateId}`);for(const id of profile.initialTemplateIds||[])require(targetPersonaTemplatesById.has(id),`${profile.id} 引用不存在的初始人格模板 ${id}`)}

    return{valid:errors.length===0,errors};
  }

  root.PERSONA_CONFIG_VALIDATOR={
    validate,
    assertValid(manifest){const result=validate(manifest);if(!result.valid)throw new Error(`配置校验失败：\n${result.errors.join('\n')}`);return manifest}
  };
})(globalThis);
