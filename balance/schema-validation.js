(function(root){
  const PERSONA_EFFECT_TYPES=new Set(['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL','ADD_XMULT_RATE']);
  const BOSS_EFFECT_TYPES=new Set(['OPENING_MULT_DOWN','FIRST_SUIT_SILENCE','DISCARD_DELTA','SUIT_SILENCE','PERSONA_DISABLE','SELECTION_LIMIT','REPEAT_FINAL_MULT','HANDS_AND_TARGET']);
  const INTERVENTION_EFFECT_TYPES=new Set(['DISCARD_DELTA','OPENING_CHIP_UP','CARD_CHIP_UP','OPENING_MULT_DOWN','FIRST_SUIT_SILENCE']);
  const PERSONA_CONDITION_TYPES=new Set(['SUBMITTED_CARD_COUNT_AT_LEAST','SUBMITTED_CARD_COUNT_AT_MOST','SUBMITTED_CARD_COUNT_EXACT','SCORING_CARD_COUNT_AT_LEAST','CURRENT_HAND_CARD_COUNT_BELOW','HAND_PRIORITY_AT_LEAST','HAND_QUALITY_IS','HAND_TYPE_IS','HAND_TYPE_IN','SAME_HAND_TYPE_STREAK_AT_LEAST','DIFFERENT_FROM_PREVIOUS_HAND','DISCARDED_CARD_COUNT_AT_LEAST','PERSONA_RUNTIME_FLAG','UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN','HAND_HAS_STRAIGHT','MIN_UNIQUE_SUITS','HAS_MATCHED_RANK_STRUCTURE','HAND_HAS_FLUSH']);
  const PERSONA_RUNTIME_EFFECT_TYPES=new Set(['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL','ADD_XMULT_RATE','ADD_COINS','ADD_HAND_LIMIT','ADD_DISCARD_LIMIT','SET_RUNTIME_FLAG','CLEAR_RUNTIME_FLAG','ADD_RUNTIME_COUNTER','ADD_GROWTH_STACK']);
  const SHOP_ITEM_TYPES=new Set(['CARD','PERSONA','SERVICE']);
  const SHOP_EFFECT_TYPES=new Set(['ADD_CARD','ADD_PERSONA','UPGRADE_CARD','REMOVE_CARD','UPGRADE_PERSONA_MAIN','UPGRADE_SUIT','UPGRADE_HAND_TYPE']);
  const SHOP_CARD_STATS=new Set(['BONUS_CHIPS','BONUS_COINS','BONUS_MULT','BONUS_XMULT_RATE']);
  const STAGE_LIMIT_CATEGORIES=new Set(['ACTION','HAND','SCORE','RESOURCE','PERSONA']);
  const STAGE_LIMIT_EFFECT_TYPES=new Set(['TARGET_SCORE_DELTA','STARTING_HAND_DELTA','STARTING_DISCARD_DELTA','STARTING_HAND_SIZE_DELTA','HAND_BASE_CHIP_DELTA_ON_QUALITY','HAND_BASE_CHIP_DELTA_ON_REPEATED_HAND_TYPE','HAND_BASE_CHIP_DELTA_ON_RANDOM_HAND_TYPE','FACE_CHIP_DELTA_FOR_RANKS','FACE_CHIP_DELTA_FOR_SUITS','HAND_BASE_MULT_DELTA','VICTORY_COIN_DELTA','PERSONA_BONUS_FACTOR']);
  const BOSS_RULE_SELECTION_MODES=new Set(['WEIGHTED_SINGLE']);
  const BOSS_RULE_PERSIST_SCOPES=new Set(['NODE_RUNTIME']);
  const BOSS_RULE_RESTORE_POLICIES=new Set(['KEEP_SAVED_RESULT']);
  const BOSS_RULE_EMPTY_POOL_POLICIES=new Set(['NO_RULE']);

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
      ['personaEntries',manifest?.basePersonas?.entries||[]],['personaMainAttributes',manifest?.basePersonas?.mainAttributes||[]],['personaSubAttributes',manifest?.basePersonas?.subAffixPool||[]],
      ['personaTemplates',manifest?.personaTemplates?.templates||[]],['personaGrowthProfiles',manifest?.personaTemplates?.growthProfiles||[]],
      ['shopItems',manifest?.shop?.items||[]],['shopRefreshProfiles',manifest?.shop?.refreshProfiles||[]],
      ['shopRefreshRules',(manifest?.shop?.refreshProfiles||[]).flatMap(profile=>profile.typeRules||[])],['shopPoolEntries',manifest?.shop?.poolEntries||[]],
      ['stageLimitRules',manifest?.stageLimits?.rules||[]],['stageLimitProfiles',manifest?.stageLimits?.profiles||[]],
      ['bossRuleSelections',manifest?.bossRuleSystem?.selections||[]],['bossRuleStageBindings',manifest?.bossRuleSystem?.stageBindings||[]],
      ['bossRulePools',manifest?.bossRuleSystem?.pools||[]],['bossRulePoolEntries',(manifest?.bossRuleSystem?.pools||[]).flatMap(pool=>pool.entries||[])],
      ['aiPersonaDirections',manifest?.aiPersonaWhitelist?.directions||[]],['aiPersonaNodePolicies',manifest?.aiPersonaWhitelist?.nodePolicies||[]],
      ['aiPersonaStrengthTiers',manifest?.aiPersonaWhitelist?.strengthTiers||[]],['aiPersonaFrequencyBands',manifest?.aiPersonaWhitelist?.frequencyBands||[]],
      ['aiPersonaTriggerParts',manifest?.aiPersonaWhitelist?.triggerParts||[]],['aiPersonaMainEffectParts',manifest?.aiPersonaWhitelist?.mainEffectParts||[]],
      ['aiPersonaGrowthParts',manifest?.aiPersonaWhitelist?.growthParts||[]],['aiPersonaNumericBudgets',manifest?.aiPersonaWhitelist?.numericBudgets||[]],
      ['aiPersonaUnresolved',manifest?.aiPersonaWhitelist?.unresolved||[]],['aiPersonaSubAttributes',manifest?.aiPersonaSubAffixes?.entries||[]]
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
    const economy=manifest?.targetEconomy,battleEconomy=economy?.battleRewards||{},shopPrices=economy?.shopPrices||{},affixCosts=economy?.personaAffixes?.unlockCosts;

    require(economy?.id==='TARGET_ECONOMY_V2'&&economy?.version===2,'正式长局必须加载 TARGET_ECONOMY_V2');
    require(JSON.stringify(battleEconomy.cycleVictoryCoins)==='[5,5,6]'&&battleEconomy.finalBattleVictoryCoins===0,'固定战斗金币必须使用每轮 5/5/6，最终战 0');
    require(battleEconomy.perRemainingHand===1&&battleEconomy.perRemainingDiscard===1,'剩余出牌与弃牌必须各奖励 1 金币');
    require(JSON.stringify(affixCosts)==='[4,6]','人格第二、第三词条必须使用 4/6 金币');
    require(Object.values(shopPrices).every(value=>Number.isFinite(value)&&value>=0),'商店统一价格表必须全部为非负数');

    require(templatesById.has(manifest?.activeRunTemplateId),'activeRunTemplateId 必须引用存在的 Run Template');
    for(const template of templatesById.values()){
      require(template.runTemplateId===template.id,`${template.id} 的 runTemplateId 必须与 id 一致`);
      require(Number.isInteger(template.version)&&template.version>0,`${template.id} 的 version 必须是正整数`);
      require(nodesById.has(template.startNodeId),`${template.id} 的 startNodeId 不存在`);
      require(Array.isArray(template.nodeIds)&&template.nodeIds.length>0,`${template.id} 必须包含 nodeIds`);
      if(template.id==='RUN_TEMPLATE_TARGET'){
        const reward=template.actionRules?.battleReward;
        for(const field of ['perRemainingHand','perRemainingDiscard'])require(Number.isFinite(reward?.[field])&&reward[field]>=0,`${template.id} 的 battleReward.${field} 必须是非负数`);
        const battleNodes=(template.nodeIds||[]).map(id=>nodesById.get(id)).filter(node=>node?.type==='BATTLE');
        require(battleNodes.every(node=>Number.isFinite(node.victoryCoins)&&node.victoryCoins>=0),`${template.id} 的每个战斗节点必须声明非负固定金币奖励`);
        for(let cycleStart=0;cycleStart<12;cycleStart+=3)require(JSON.stringify(battleNodes.slice(cycleStart,cycleStart+3).map(node=>node.victoryCoins))===JSON.stringify(battleEconomy.cycleVictoryCoins),`${template.id} 第 ${cycleStart/3+1} 轮固定金币必须为 5/5/6`);
        require(battleNodes.at(-1)?.victoryCoins===battleEconomy.finalBattleVictoryCoins,`${template.id} 最终战固定金币与经济配置不一致`);
        require(template.stageLimitConfigId===manifest?.stageLimits?.id,`${template.id} 必须引用正式关卡限制配置`);
      }
      const compatibilityNodes=new Set(template.compatibilityNodeIds||[]);
      for(const nodeId of compatibilityNodes){require((template.nodeIds||[]).includes(nodeId),`${template.id} 的兼容节点 ${nodeId} 必须包含在 nodeIds 中`);require(nodesById.get(nodeId)?.compatibilityOnly===true,`${template.id} 的兼容节点 ${nodeId} 必须标记 compatibilityOnly`)}
      for(const nodeId of template.nodeIds||[])require(nodesById.has(nodeId),`${template.id} 引用了不存在的节点 ${nodeId}`);
      require(nodesById.has(template.endCondition?.nodeId),`${template.id} 的结束节点不存在`);
      const allowed=new Set(template.nodeIds||[]),visited=new Set(),queue=[template.startNodeId];
      while(queue.length){const id=queue.shift();if(visited.has(id)||!allowed.has(id))continue;visited.add(id);for(const transition of nodesById.get(id)?.transitions||[])if(transition.to!=='RUN_END')queue.push(transition.to)}
      for(const nodeId of allowed)if(!compatibilityNodes.has(nodeId))require(visited.has(nodeId),`${template.id} 中存在从起点不可达的节点 ${nodeId}`);
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

    for(const profile of scoringProfilesById.values()){
      const isTarget=profile.id==='POKER_HAND_PROFILE_TARGET_V1',expectedCount=isTarget?11:9;
      require(Array.isArray(profile.hands)&&profile.hands.length===expectedCount,`牌型 Profile ${profile.id} 必须包含 ${expectedCount} 种牌型`);
      require(new Set(profile.hands.map(item=>item.id)).size===expectedCount,`牌型 Profile ${profile.id} 的运行时牌型 ID 必须唯一`);
      for(const hand of profile.hands)require(Number.isFinite(hand.chips)&&Number.isFinite(hand.mult),`牌型 Profile ${profile.id}/${hand.id} 数值无效`);
      if(isTarget){
        require(profile.decisionStatus==='CONFIRMED',`${profile.id} 必须使用最新策划确认状态`);
        require(new Set(profile.hands.map(item=>item.handId)).size===11,`${profile.id} 的手牌_ID 必须唯一`);
        require(new Set(profile.hands.map(item=>item.displayOrder)).size===11,`${profile.id} 的显示顺序必须唯一`);
        for(const hand of profile.hands){require(/^HAND_\d{2}$/.test(hand.handId),`${profile.id}/${hand.id} 缺少合法手牌_ID`);require(['NORMAL','RARE'].includes(hand.qualityId),`${profile.id}/${hand.id} 的牌型品质不合法`);require(Number.isInteger(hand.scoringCardCount)&&hand.scoringCardCount>=1&&hand.scoringCardCount<=5,`${profile.id}/${hand.id} 的计分牌数不合法`);require(Number.isInteger(hand.displayOrder)&&hand.displayOrder>=1&&hand.displayOrder<=11,`${profile.id}/${hand.id} 的显示顺序不合法`);require(hand.decisionStatus==='CONFIRMED',`${profile.id}/${hand.id} 必须标记为最新确认值`)}
      }
    }
    for(const template of templatesById.values())require(scoringProfilesById.has(template.scoringProfileId||'POKER_HAND_PROFILE_CURRENT_DEMO'),`${template.id} 的 scoringProfileId 不存在`);

    const referencedEncounters=new Set((manifest?.stageNodes||[]).filter(item=>item.type==='BATTLE').map(item=>item.encounterId));
    for(const encounter of encountersById.values()){
      require(referencedEncounters.has(encounter.id)||encounter.referenceOnly===true,`Encounter ${encounter.id} 未被战斗节点使用`);
      if(encounter.mode==='NEUTRAL_PROTOTYPE'){require(encounter.bossProfileId===null&&encounter.interventionProfileId===null,`Neutral Encounter ${encounter.id} 不应引用 Boss/Intervention Profile`);require(scoringProfilesById.has(encounter.scoringProfileId),`Neutral Encounter ${encounter.id} 的 scoringProfileId 不存在`)}else{require(bossProfilesById.has(encounter.bossProfileId),`Encounter ${encounter.id} 的 bossProfileId 不存在`);require(interventionProfilesById.has(encounter.interventionProfileId),`Encounter ${encounter.id} 的 interventionProfileId 不存在`)}
    }

    const usedBossProfiles=new Set((manifest?.encounters||[]).map(item=>item.bossProfileId));
    const usedBossRules=new Set((manifest?.bossProfiles?.profiles||[]).flatMap(item=>item.ruleIds||[]));
    for(const profile of bossProfilesById.values()){
      require(usedBossProfiles.has(profile.id)||profile.referenceOnly===true,`Boss Profile ${profile.id} 未被 Encounter 使用`);
      require(Array.isArray(profile.ruleIds)&&profile.ruleIds.length>0,`Boss Profile ${profile.id} 必须包含 ruleIds`);
      for(const ruleId of profile.ruleIds||[])require(bossRulesById.has(ruleId),`Boss Profile ${profile.id} 引用了不存在的规则 ${ruleId}`);
    }
    for(const rule of bossRulesById.values()){
      require(usedBossRules.has(rule.id)||rule.referenceOnly===true,`Boss 规则 ${rule.id} 未被任何 Boss Profile 使用`);
      require(BOSS_EFFECT_TYPES.has(rule.effectType),`Boss 规则 ${rule.id} 使用了不允许的 effectType：${rule.effectType}`);
    }

    const usedInterventionProfiles=new Set((manifest?.encounters||[]).map(item=>item.interventionProfileId));
    const usedInterventionEvents=new Set((manifest?.interventions?.profiles||[]).flatMap(item=>item.eventIds||[]));
    for(const profile of interventionProfilesById.values()){
      require(usedInterventionProfiles.has(profile.id)||profile.referenceOnly===true,`Intervention Profile ${profile.id} 未被 Encounter 使用`);
      const probabilities=Object.values(profile.kindProbability||{});
      require(probabilities.length>0&&probabilities.every(value=>Number.isFinite(value)&&value>=0&&value<=1),`${profile.id} 的概率必须位于 0 到 1`);
      require(Math.abs(probabilities.reduce((sum,value)=>sum+value,0)-1)<1e-9,`${profile.id} 的概率组之和必须为 1`);
      for(const eventId of profile.eventIds||[])require(interventionEventsById.has(eventId),`${profile.id} 引用了不存在的事件 ${eventId}`);
    }
    for(const event of interventionEventsById.values()){
      require(usedInterventionEvents.has(event.id)||event.referenceOnly===true,`介入事件 ${event.id} 未被任何 Intervention Profile 使用`);
      require(INTERVENTION_EFFECT_TYPES.has(event.effectType),`介入事件 ${event.id} 使用了不允许的 effectType：${event.effectType}`);
    }
    const entries=manifest?.basePersonas?.entries||[],mainAttributes=manifest?.basePersonas?.mainAttributes||[],entryIds=new Set(entries.map(item=>item.id)),mainAttributeIds=new Set(mainAttributes.map(item=>item.id)),subAffixPool=manifest?.basePersonas?.subAffixPool||[],subAffixIds=new Set(subAffixPool.map(item=>item.id)),aiSubAffixConfig=manifest?.aiPersonaSubAffixes||{},aiSubAffixPool=aiSubAffixConfig.entries||[],aiSubAffixIds=new Set(aiSubAffixPool.map(item=>item.id));
    require(entries.length===8&&entryIds.size===8,'基础人格必须包含 8 个唯一 ENTRY');
    require(mainAttributes.length===8&&mainAttributeIds.size===8,'基础人格必须包含 8 个唯一 MAIN');
    require(subAffixPool.length===40&&subAffixIds.size===40,'基础人格次级属性池必须包含 40 条唯一配置');
    for(const affix of subAffixPool){require(typeof affix.name==='string'&&typeof affix.effectText==='string',`次级属性 ${affix.id} 缺少显示字段`);require(Number.isFinite(affix.weight)&&affix.weight>0,`次级属性 ${affix.id} 权重必须大于 0`);require(['AI1','AI2','AI3'].includes(affix.unlockProfileId),`次级属性 ${affix.id} 开放节点不合法`);require(Number.isInteger(affix.unlockProfileOrder)&&affix.unlockProfileOrder>=1&&affix.unlockProfileOrder<=3,`次级属性 ${affix.id} 开放顺序不合法`);require(affix.runtimeEnabled===true||affix.decisionStatus==='UNDECIDED',`次级属性 ${affix.id} 必须接入运行时或标记 UNDECIDED`);for(const effect of affix.effects||[])validateEffect(effect,affix.id,{})}
    require(aiSubAffixConfig.id==='TARGET_AI_PERSONA_SUB_AFFIXES_V1'&&aiSubAffixConfig.schemaVersion===1,'AI 人格副属性配置版本不合法');
    require(aiSubAffixPool.length===6&&aiSubAffixIds.size===6,'AI 人格副属性池必须包含 6 条唯一配置');
    require(JSON.stringify(aiSubAffixConfig.unlockCosts)===JSON.stringify(affixCosts)&&aiSubAffixConfig.disallowSameAttributeType===true,'AI 人格副属性解锁价格必须使用统一经济配置并启用同属性互斥');
    for(const slotIndex of [0,1]){const pool=aiSubAffixConfig.slotPools?.find(item=>item.slotIndex===slotIndex),expectedIds=aiSubAffixPool.filter(item=>item.slotIndex===slotIndex).map(item=>item.id);require(pool?.weightTotal===100&&expectedIds.length===3&&expectedIds.reduce((sum,id)=>sum+(aiSubAffixPool.find(item=>item.id===id)?.weight||0),0)===100,`AI 人格第 ${slotIndex+2} 词条池必须包含 3 条且总权重为 100`);require(JSON.stringify(pool?.entryIds)===JSON.stringify(expectedIds),`AI 人格第 ${slotIndex+2} 词条池引用不完整`)}
    for(const affix of aiSubAffixPool){require([0,1].includes(affix.slotIndex)&&JSON.stringify(affix.slotIndexes)===`[${affix.slotIndex}]`,`AI 人格副属性 ${affix.id} 的槽位限定不合法`);require(['BASE_CHIPS','BASE_MULT','XMULT_RATE'].includes(affix.attributeType),`AI 人格副属性 ${affix.id} 使用了首版外属性`);require(affix.runtimeEnabled===true&&affix.decisionStatus==='CONFIRMED',`AI 人格副属性 ${affix.id} 必须确认并启用`);for(const effect of affix.effects||[])validateEffect(effect,affix.id,{})}
    require(JSON.stringify(manifest?.aiPersonaWhitelist?.affixPolicy?.poolIds)===JSON.stringify(aiSubAffixPool.map(item=>item.id)),'AI 人格白名单未引用完整副属性池');
    for(const personaId of manifest?.basePersonas?.defaultLoadoutIds||[])require(personaIds.has(personaId),`默认人格装备引用不存在的 ID：${personaId}`);
    for(const baseTemplate of manifest?.basePersonas?.templates||[]){const unified=targetPersonaTemplatesById.get(baseTemplate.id),rules=baseTemplate.subAffixRules||{},pool=subAffixPool.filter(item=>item.personaId===baseTemplate.personaId);require(!!unified,`基础人格 ${baseTemplate.id} 未汇入统一 Persona Template 注册表`);require(JSON.stringify(unified)===JSON.stringify(baseTemplate),`基础人格 ${baseTemplate.id} 与统一 Persona Template 数据不一致`);require(entryIds.has(baseTemplate.entryId),`基础人格 ${baseTemplate.id} 引用了不存在的 ENTRY`);require(mainAttributeIds.has(baseTemplate.mainAttributeId),`基础人格 ${baseTemplate.id} 引用了不存在的 MAIN`);require(rules.schemaVersion===2&&rules.slotCount===2&&rules.defaultUnlockedCount===0,`基础人格 ${baseTemplate.id} 必须使用两槽次级属性结构`);require(JSON.stringify(rules.unlockCosts)===JSON.stringify(affixCosts),`基础人格 ${baseTemplate.id} 解锁成本必须使用统一经济配置`);require(rules.allowDuplicates===false,`基础人格 ${baseTemplate.id} 次级属性不得重复`);require(pool.length===5&&pool.reduce((sum,item)=>sum+item.weight,0)===100,`基础人格 ${baseTemplate.id} 必须配置 5 项、总权重 100 的独立属性池`);require(new Set(rules.poolIds||[]).size===5&&(rules.poolIds||[]).every(id=>pool.some(item=>item.id===id)),`基础人格 ${baseTemplate.id} 的属性池引用不完整`)}

    const qualities=new Set(manifest?.personaTemplates?.qualities||[]),families=new Set(manifest?.personaTemplates?.behaviorFamilies||[]);
    function validateCondition(condition,owner){
      require(PERSONA_CONDITION_TYPES.has(condition?.type),`${owner} 使用了不允许的 condition type：${condition?.type}`);
      if(['SUBMITTED_CARD_COUNT_AT_LEAST','SUBMITTED_CARD_COUNT_AT_MOST','SUBMITTED_CARD_COUNT_EXACT','SCORING_CARD_COUNT_AT_LEAST','CURRENT_HAND_CARD_COUNT_BELOW','HAND_PRIORITY_AT_LEAST','SAME_HAND_TYPE_STREAK_AT_LEAST','DISCARDED_CARD_COUNT_AT_LEAST'].includes(condition?.type))require(Number.isFinite(condition.value),`${owner} 的条件数值必须是数字`);
      if(condition?.type==='HAND_QUALITY_IS')require(['NORMAL','RARE'].includes(condition.value),`${owner} 的牌型品质条件不合法`);
      if(condition?.type==='HAND_TYPE_IN')require(Array.isArray(condition.values)&&condition.values.length>0,`${owner} 的 HAND_TYPE_IN 必须包含 values`);
      if(condition?.type==='PERSONA_RUNTIME_FLAG')require(typeof condition.key==='string'&&condition.key.length>0,`${owner} 的运行时标记必须包含 key`);
    }
    function validateEffect(effect,owner,runtimeDefaults){
      require(PERSONA_RUNTIME_EFFECT_TYPES.has(effect?.type),`${owner} 使用了不允许的 runtime effect：${effect?.type}`);
      if(['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL','ADD_XMULT_RATE','ADD_COINS','ADD_HAND_LIMIT','ADD_DISCARD_LIMIT'].includes(effect?.type))require(Number.isFinite(effect.value)||Number.isFinite(effect.valuePerStack),`${owner} 的数值效果必须包含 value 或 valuePerStack`);
      if(['SET_RUNTIME_FLAG','CLEAR_RUNTIME_FLAG'].includes(effect?.type))require(typeof effect.key==='string'&&effect.key in runtimeDefaults,`${owner} 的标记效果必须引用 runtimeDefaults 中的 key`);
      if(['ADD_RUNTIME_COUNTER','ADD_GROWTH_STACK'].includes(effect?.type))require(typeof effect.runtimeCounter==='string'&&effect.runtimeCounter in runtimeDefaults,`${owner} 的计数效果必须引用 runtimeDefaults 中的 counter`);
    }
    for(const template of targetPersonaTemplatesById.values()){
      require(qualities.has(template.qualityId),`${template.id} 的 qualityId 不合法`);require(template.behaviorFamilyId===null||families.has(template.behaviorFamilyId),`${template.id} 的 behaviorFamilyId 不合法`);
      if(personaIds.has(template.id)){require(/^人格牌0[1-8]$/.test(template.displayId)&&template.name===template.displayId,`${template.id} 必须统一显示人格牌ID`);require(typeof template.mainEntry==='string'&&template.mainEntry.length>0,`${template.id} 缺少主词条`);require(typeof template.mainEffect?.triggerText==='string'&&typeof template.mainEffect?.effectText==='string',`${template.id} 缺少主效果文案`);require(template.subAffixRules?.schemaVersion===2&&template.subAffixRules?.slotCount===2&&template.subAffixRules?.defaultUnlockedCount===0,`${template.id} 必须配置第二、第三两个次级属性槽`);require(Array.isArray(template.subAffixRules?.unlockCosts)&&template.subAffixRules.unlockCosts.length===2,`${template.id} 缺少次级属性解锁消耗`);for(const id of template.subAffixRules?.poolIds||[])require(subAffixIds.has(id),`${template.id} 引用了不存在的次级属性 ${id}`)}
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

    const shop=manifest?.shop,shopItems=shop?.items||[],shopProfiles=shop?.refreshProfiles||[],shopPoolEntries=shop?.poolEntries||[],shopItemsById=new Map(shopItems.map(item=>[item.id,item])),shopProfilesById=new Map(shopProfiles.map(profile=>[profile.id,profile]));
    require(shop?.id==='TARGET_SHOP_V1','正式商店必须加载 TARGET_SHOP_V1');
    require(Number.isInteger(shop?.version)&&shop.version>0,'商店配置 version 必须为正整数');
    require(shop?.selectionPolicy?.mode==='CATEGORY_THEN_ITEM'&&shop?.selectionPolicy?.withoutReplacement===true,'商店必须先抽商品类别、再无放回抽具体商品');
    require(shopItems.length===60+personaIds.size,`商店必须包含 52 件卡牌、8 件服务和 ${personaIds.size} 件基础人格商品`);
    require(shopItems.filter(item=>item.itemType==='CARD').length===52,'商店必须包含 52 件卡牌商品');
    require(shopItems.filter(item=>item.itemType==='PERSONA').length===personaIds.size,'每张基础人格必须且只能生成一件商店商品');
    require(shopItems.filter(item=>item.itemType==='SERVICE').length===8,'商店必须包含 8 件服务商品');
    require(shopItems.filter(item=>item.itemType==='CARD').every(item=>item.price===shopPrices.card),'商店卡牌价格必须使用统一经济配置');
    require(shopItems.filter(item=>item.itemType==='PERSONA').every(item=>item.price===shopPrices.persona),'商店人格价格必须使用统一经济配置');
    const expectedServicePrices={SHOP_SERVICE_001:'cardChips',SHOP_SERVICE_002:'cardCoins',SHOP_SERVICE_003:'cardMultiplier',SHOP_SERVICE_004:'cardIndependentMultiplier',SHOP_SERVICE_005:'removeCard',SHOP_SERVICE_006:'buildUpgradeBase',SHOP_SERVICE_007:'buildUpgradeBase',SHOP_SERVICE_008:'buildUpgradeBase'};
    for(const [itemId,priceKey] of Object.entries(expectedServicePrices))require(shopItemsById.get(itemId)?.price===shopPrices[priceKey],`商店服务 ${itemId} 价格未使用统一经济配置`);
    for(const itemId of ['SHOP_SERVICE_006','SHOP_SERVICE_007','SHOP_SERVICE_008'])require(shopItemsById.get(itemId)?.priceGrowth?.increment===shopPrices.buildUpgradePerTargetLevel,`成长商品 ${itemId} 涨价未使用统一经济配置`);
    require(JSON.stringify({...shop?.assumptions?.refreshPrice,decisionStatus:undefined})===JSON.stringify({...economy.refreshPrice,decisionStatus:undefined}),'商店刷新价格必须使用统一经济配置');
    const cardDefinitions=new Set(),shopPersonaTemplateIds=new Set();
    for(const item of shopItems){
      require(SHOP_ITEM_TYPES.has(item.itemType),`商店商品 ${item.id} 的 itemType 不合法：${item.itemType}`);
      require(typeof item.name==='string'&&item.name.length>0,`商店商品 ${item.id} 缺少名称`);
      require(Number.isFinite(item.price)&&item.price>=0,`商店商品 ${item.id} 的价格必须是非负数`);
      require(Number.isInteger(item.purchaseLimit)&&item.purchaseLimit>0,`商店商品 ${item.id} 的购买上限必须是正整数`);
      require(item.purchaseLimitScope==='SHOP_VISIT',`商店商品 ${item.id} 的限购作用域必须为 SHOP_VISIT`);
      require(SHOP_EFFECT_TYPES.has(item.effect?.type),`商店商品 ${item.id} 的 effect type 不合法：${item.effect?.type}`);
      if(item.itemType==='CARD'){
        require(item.effect?.type==='ADD_CARD'&&item.effect.quantity===1,`卡牌商品 ${item.id} 必须配置 ADD_CARD ×1`);
        const card=item.effect?.card,key=`${card?.suitSymbol}:${card?.rank}`;
        require(['♠','♥','♣','♦'].includes(card?.suitSymbol)&&['A','2','3','4','5','6','7','8','9','10','J','Q','K'].includes(String(card?.rank)),`卡牌商品 ${item.id} 的牌面不合法`);
        require(!cardDefinitions.has(key),`商店卡牌牌面重复：${key}`);cardDefinitions.add(key);
        require(typeof item.effect.cardConfigId==='string'&&item.effect.cardConfigId.length>0,`卡牌商品 ${item.id} 缺少 cardConfigId`);
      }
      if(item.itemType==='PERSONA'){require(item.effect?.type==='ADD_PERSONA'&&item.effect.quantity===1,`人格商品 ${item.id} 必须配置 ADD_PERSONA ×1`);require(personaIds.has(item.effect?.personaTemplateId),`人格商品 ${item.id} 必须引用正式基础人格 ${item.effect?.personaTemplateId}`);require(!shopPersonaTemplateIds.has(item.effect?.personaTemplateId),`基础人格 ${item.effect?.personaTemplateId} 被重复加入商店`);shopPersonaTemplateIds.add(item.effect?.personaTemplateId)}
      if(item.itemType==='SERVICE'){
        require(item.effect?.requiresTarget===true,`服务商品 ${item.id} 必须要求选择目标卡牌`);
        if(item.effect?.type==='UPGRADE_CARD'){require(SHOP_CARD_STATS.has(item.effect.targetStat),`服务商品 ${item.id} 的强化字段不合法`);require(Number.isFinite(item.effect.amount)&&item.effect.amount>0,`服务商品 ${item.id} 的强化值必须大于 0`)}
        else if(item.effect?.type==='REMOVE_CARD')require(item.effect.quantity===1,`移除服务 ${item.id} 必须配置 REMOVE_CARD ×1`);
        else if(item.effect?.type==='UPGRADE_PERSONA_MAIN'){const amounts=item.effect.amountByAttributeType||{};require(item.effect.targetKind==='PERSONA'&&amounts.BASE_CHIPS>0&&amounts.BASE_MULT>0&&amounts.XMULT_RATE>0,`人格主词条强化 ${item.id} 配置不完整`)}
        else if(item.effect?.type==='UPGRADE_SUIT')require(item.effect.targetKind==='SUIT'&&Number.isFinite(item.effect.chipsPerScoringCard)&&item.effect.chipsPerScoringCard>0,`花色强化 ${item.id} 配置不完整`);
        else if(item.effect?.type==='UPGRADE_HAND_TYPE')require(item.effect.targetKind==='HAND_TYPE'&&item.effect.baseChipRate>0&&item.effect.baseMultRate>0,`牌型强化 ${item.id} 配置不完整`);
        if(item.priceGrowth)require(item.priceGrowth.type==='PER_TARGET_LEVEL'&&Number.isFinite(item.priceGrowth.increment)&&item.priceGrowth.increment>0,`成长商品 ${item.id} 的价格成长配置不合法`);
      }
    }
    require(cardDefinitions.size===52,'商店卡牌必须完整覆盖 4 花色 × 13 点数');
    require(shopPersonaTemplateIds.size===personaIds.size&&[...personaIds].every(id=>shopPersonaTemplateIds.has(id)),'基础人格商店商品覆盖不完整');
    require(shopProfiles.length===3,'商店必须包含 AI1/AI2/AI3 三个刷新档位');
    for(const expected of ['AI1','AI2','AI3'])require(shopProfilesById.has(expected),`商店缺少刷新档位 ${expected}`);
    for(const profile of shopProfiles){
      require(nodesById.has(profile.stageNodeId),`商店刷新档位 ${profile.id} 引用了不存在的节点 ${profile.stageNodeId}`);
      require(nodesById.get(profile.stageNodeId)?.shopProfileId===profile.id,`节点 ${profile.stageNodeId} 未声明 shopProfileId ${profile.id}`);
      require(Number.isInteger(profile.offerSlotCount)&&profile.offerSlotCount>0,`商店刷新档位 ${profile.id} 的槽位数不合法`);
      const types=new Set((profile.typeRules||[]).map(rule=>rule.itemType));
      require(profile.typeRules?.length===3&&types.size===3&&[...SHOP_ITEM_TYPES].every(type=>types.has(type)),`商店刷新档位 ${profile.id} 必须覆盖三种商品类型`);
      require((profile.typeRules||[]).every(rule=>Number.isInteger(rule.drawCount)&&rule.drawCount>0&&Number.isInteger(rule.maxPerRefresh)&&rule.maxPerRefresh>=rule.drawCount&&rule.maxPerRefresh<=profile.offerSlotCount&&Number.isFinite(rule.weight)&&rule.weight>0),`商店刷新档位 ${profile.id} 的抽取数量、单次上限或权重不合法`);
      require((profile.typeRules||[]).find(rule=>rule.itemType==='PERSONA')?.maxPerRefresh===1,`商店刷新档位 ${profile.id} 的人格商品单次上限必须为 1`);
      require(Math.abs((profile.typeRules||[]).reduce((sum,rule)=>sum+rule.weight,0)-100)<1e-9,`商店刷新档位 ${profile.id} 的类型权重之和必须为 100`);
    }
    require(shopPoolEntries.length===shopItems.length,'商店商品池记录数必须与商品数一致');
    const pooledItemIds=new Set();
    for(const entry of shopPoolEntries){const item=shopItemsById.get(entry.itemId);require(!!item,`商品池 ${entry.id} 引用了不存在的商品 ${entry.itemId}`);require(Number.isFinite(entry.weight)&&entry.weight>0,`商品池 ${entry.id} 的权重必须大于 0`);require(item?.itemType===entry.poolType,`商品池 ${entry.id} 的类型与商品不一致`);require(!pooledItemIds.has(entry.itemId),`商品 ${entry.itemId} 被重复加入商品池`);pooledItemIds.add(entry.itemId)}
    require(pooledItemIds.size===shopItems.length,'每件商店商品必须且只能配置一条商品池权重');
    for(const node of nodesById.values())if(node.shopProfileId)require(shopProfilesById.has(node.shopProfileId),`节点 ${node.id} 引用了不存在的商店档位 ${node.shopProfileId}`);

    const stageLimits=manifest?.stageLimits,stageLimitRules=stageLimits?.rules||[],stageLimitProfiles=stageLimits?.profiles||[],stageLimitRuleIds=new Set(stageLimitRules.map(rule=>rule.id));
    require(stageLimits?.id==='TARGET_STAGE_LIMITS_V1','正式长局必须加载 TARGET_STAGE_LIMITS_V1');
    require(stageLimitRules.length===14,'正式关卡限制池必须包含 14 条规则');
    require(stageLimits?.firstRestrictedBattleNumber===4,'前 3 场战斗必须保持无关卡限制');
    require(stageLimits?.recentRuleCooldown===2,'关卡限制必须避开最近 2 条已用规则');
    for(const rule of stageLimitRules){
      require(STAGE_LIMIT_CATEGORIES.has(rule.category),`关卡限制 ${rule.id} 的分类不合法`);
      require(STAGE_LIMIT_EFFECT_TYPES.has(rule.effect?.type),`关卡限制 ${rule.id} 的效果类型不合法`);
      require(typeof rule.name==='string'&&rule.name.length>0&&typeof rule.description==='string'&&rule.description.length>0,`关卡限制 ${rule.id} 缺少展示文案`);
      require(rule.decisionStatus==='CONFIRMED',`关卡限制 ${rule.id} 必须完成策划确认`);
      if('factor' in (rule.effect||{}))require(rule.effect.factor>0&&rule.effect.factor<1,`关卡限制 ${rule.id} 的 factor 必须位于 0 与 1 之间`);
      if(rule.effect?.type==='HAND_BASE_CHIP_DELTA_ON_RANDOM_HAND_TYPE')require(Array.isArray(rule.effect.options)&&rule.effect.options.length>=3&&rule.effect.options.every(option=>option.id&&option.name),`关卡限制 ${rule.id} 缺少可选牌型`);
      require(!rule.description.includes('最终得分')&&!rule.description.includes('只保留'),`关卡限制 ${rule.id} 使用了不直观的结算层文案`);
    }
    require(stageLimitProfiles.length===4,'关卡限制必须配置中期、后期、终盘与最终战四个档位');
    const profiledBattles=[...new Set(stageLimitProfiles.flatMap(profile=>profile.battleNumbers||[]))].sort((a,b)=>a-b);
    require(JSON.stringify(profiledBattles)===JSON.stringify([4,5,6,7,8,9,10,11,12,13]),'关卡限制档位必须完整覆盖第 4 至第 13 场战斗');
    for(const profile of stageLimitProfiles){
      if(profile.categoryWeights)require(Math.abs(Object.values(profile.categoryWeights).reduce((sum,value)=>sum+value,0)-100)<1e-9,`关卡限制档位 ${profile.id} 的分类权重之和必须为 100`);
      for(const ruleId of profile.ruleIds||[]){require(stageLimitRuleIds.has(ruleId),`关卡限制档位 ${profile.id} 引用了不存在的规则 ${ruleId}`);require(stageLimitRules.find(rule=>rule.id===ruleId)?.finalSafe===true,`最终战规则 ${ruleId} 必须标记为安全规则`)}
    }

    const bossRuleSystem=manifest?.bossRuleSystem,bossRuleSelections=bossRuleSystem?.selections||[],bossRuleBindings=bossRuleSystem?.stageBindings||[],bossRulePools=bossRuleSystem?.pools||[];
    const bossRuleSelectionById=new Map(bossRuleSelections.map(item=>[item.id,item])),bossRulePoolById=new Map(bossRulePools.map(item=>[item.id,item]));
    require(bossRuleSystem?.id==='TARGET_BOSS_RULE_SYSTEM_V1','Boss 规则系统必须使用 TARGET_BOSS_RULE_SYSTEM_V1');
    require(bossRuleSystem?.schemaVersion===1,'Boss 规则系统 schemaVersion 必须为 1');
    require(bossRuleSystem?.runtimeEnabled===false,'Boss 规则系统本阶段不得接入正式战斗运行时');
    require(bossRuleSystem?.decisionStatus==='UNDECIDED','Boss 规则系统启用决策必须保持 UNDECIDED');
    require(bossRuleSystem?.ruleSourceConfigId===stageLimits?.id,'Boss 规则系统必须引用正式关卡限制配置作为规则唯一数据源');
    require(bossRuleSelections.length===1,'Boss 规则系统必须且只能配置一个抽取策略');
    require(bossRuleBindings.length===1,'Boss 规则系统必须且只能绑定最终关一次');
    require(bossRulePools.length===1,'Boss 规则系统必须且只能配置一个最终关规则池');
    for(const selection of bossRuleSelections){
      require(BOSS_RULE_SELECTION_MODES.has(selection.mode),`Boss 抽取策略 ${selection.id} 的 mode 不合法`);
      require(selection.drawCount===1,`Boss 抽取策略 ${selection.id} 每场必须只抽取 1 条规则`);
      require(selection.weightScale==='RELATIVE',`Boss 抽取策略 ${selection.id} 必须使用相对权重`);
      require(BOSS_RULE_PERSIST_SCOPES.has(selection.persistScope),`Boss 抽取策略 ${selection.id} 的存档作用域不合法`);
      require(BOSS_RULE_RESTORE_POLICIES.has(selection.restorePolicy),`Boss 抽取策略 ${selection.id} 的读档策略不合法`);
      require(BOSS_RULE_EMPTY_POOL_POLICIES.has(selection.emptyPoolPolicy),`Boss 抽取策略 ${selection.id} 的空池策略不合法`);
    }
    for(const binding of bossRuleBindings){
      const node=nodesById.get(binding.runtimeNodeId),selection=bossRuleSelectionById.get(binding.selectionId),pool=bossRulePoolById.get(binding.poolId);
      require(binding.stageId==='STAGE_17'&&binding.stageOrder===17,`Boss 规则绑定 ${binding.id} 必须对应最新阶段表 STAGE_17`);
      require(binding.runtimeNodeId==='N17'&&binding.battleNumber===13,`Boss 规则绑定 ${binding.id} 必须对应第 13 场战斗节点 N17`);
      require(binding.stageType==='BOSS_BATTLE',`Boss 规则绑定 ${binding.id} 的 stageType 不合法`);
      require(node?.type==='BATTLE'&&node?.finalBattle===true&&node?.targetScore===3200,`Boss 规则绑定 ${binding.id} 必须指向 3200 分最终战`);
      require(node?.encounterId===binding.encounterId&&binding.encounterId==='TARGET_ENCOUNTER_FINAL',`Boss 规则绑定 ${binding.id} 的 encounterId 不一致`);
      require(!!selection,`Boss 规则绑定 ${binding.id} 引用了不存在的抽取策略 ${binding.selectionId}`);
      require(!!pool,`Boss 规则绑定 ${binding.id} 引用了不存在的规则池 ${binding.poolId}`);
      require(binding.maxAppliedRules===selection?.drawCount&&binding.maxAppliedRules===1,`Boss 规则绑定 ${binding.id} 每场只能应用 1 条规则`);
      require(binding.decisionStatus==='UNDECIDED',`Boss 规则绑定 ${binding.id} 的启用决策必须保持 UNDECIDED`);
    }
    const configuredBossRuleIds=[];
    for(const pool of bossRulePools){
      require(Array.isArray(pool.entries)&&pool.entries.length===6,`Boss 规则池 ${pool.id} 必须包含 6 条安全规则`);
      const entryIds=new Set(),ruleIds=new Set(),weights=[];
      for(const entry of pool.entries||[]){
        const rule=stageLimitRules.find(item=>item.id===entry.ruleId);
        require(!entryIds.has(entry.id),`Boss 规则池 ${pool.id} 的条目 ID 重复：${entry.id}`);entryIds.add(entry.id);
        require(!ruleIds.has(entry.ruleId),`Boss 规则池 ${pool.id} 重复引用规则：${entry.ruleId}`);ruleIds.add(entry.ruleId);configuredBossRuleIds.push(entry.ruleId);
        require(!!rule,`Boss 规则池 ${pool.id} 引用了不存在的规则 ${entry.ruleId}`);
        require(rule?.finalSafe===true,`Boss 规则池 ${pool.id} 只能引用 finalSafe 规则：${entry.ruleId}`);
        require(Number.isFinite(entry.weight)&&entry.weight>0,`Boss 规则池条目 ${entry.id} 的权重必须大于 0`);weights.push(entry.weight);
        require(entry.enabled===true,`Boss 规则池条目 ${entry.id} 必须显式启用`);
        require(!('effect' in entry)&&!('description' in entry),`Boss 规则池条目 ${entry.id} 不得复制规则效果或文案`);
      }
      require(weights.length>0&&weights.every(weight=>weight===weights[0]),`Boss 规则池 ${pool.id} 必须保持当前最终关的等权抽取`);
    }
    const finalStageLimitRuleIds=stageLimitProfiles.find(profile=>profile.id==='TARGET_STAGE_LIMIT_FINAL')?.ruleIds||[];
    require(JSON.stringify([...configuredBossRuleIds].sort())===JSON.stringify([...finalStageLimitRuleIds].sort()),'Boss 规则池必须完整引用最终关安全规则，不得维护第二份数值');

    const aiWhitelistValidator=root.PERSONA_BALANCE_MODULES?.aiPersonaWhitelistValidator;
    require(!!aiWhitelistValidator,'缺少 AI 人格白名单独立校验器');
    if(aiWhitelistValidator){
      const result=aiWhitelistValidator.validate(manifest?.aiPersonaWhitelist,{conditionTypes:PERSONA_CONDITION_TYPES,runtimeEffectTypes:PERSONA_RUNTIME_EFFECT_TYPES,shop:manifest?.shop,economy,nodesById});
      errors.push(...result.errors);
    }

    return{valid:errors.length===0,errors};
  }

  root.PERSONA_CONFIG_VALIDATOR={
    validate,
    assertValid(manifest){const result=validate(manifest);if(!result.valid)throw new Error(`配置校验失败：\n${result.errors.join('\n')}`);return manifest}
  };
})(globalThis);
