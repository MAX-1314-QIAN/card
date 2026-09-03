(function(root){
  'use strict';
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const VALID_EVENTS=new Set(['HAND_COMMITTED','DISCARD_COMMITTED']);
  const VALID_DIRECTION_MODES=new Set(['FIXED','RANDOM_SWAP_WITHOUT_REPLACEMENT']);
  const VALID_PERSIST_SCOPES=new Set(['RUN_STATE']);
  const VALID_VALUE_SOURCES=new Set(['BEHAVIOR_DOMINANT_HAND_TYPE','BEHAVIOR_SECONDARY_HAND_TYPE']);
  const VALID_VALUES_SOURCES=new Set(['BEHAVIOR_TOP_TWO_HAND_TYPES']);

  function nearlyEqual(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9}

  function validate(config,{conditionTypes=new Set(),runtimeEffectTypes=new Set(),shop=null,nodesById=new Map()}={}){
    const errors=[];
    const require=(condition,message)=>{if(!condition)errors.push(message)};
    const unique=(items,label)=>{
      const seen=new Set();
      for(const item of items||[]){
        require(typeof item?.id==='string'&&item.id.length>0,`${label} 存在无效 ID`);
        if(!item?.id)continue;
        require(!seen.has(item.id),`${label} ID 重复：${item.id}`);
        seen.add(item.id);
      }
      return seen;
    };
    const validateCondition=(condition,owner,runtimeDefaults={})=>{
      require(conditionTypes.has(condition?.type),`${owner} 使用了不在运行时白名单中的条件：${condition?.type}`);
      const numericTypes=['SUBMITTED_CARD_COUNT_AT_LEAST','SUBMITTED_CARD_COUNT_AT_MOST','SUBMITTED_CARD_COUNT_EXACT','SCORING_CARD_COUNT_AT_LEAST','CURRENT_HAND_CARD_COUNT_BELOW','HAND_PRIORITY_AT_LEAST','SAME_HAND_TYPE_STREAK_AT_LEAST','DISCARDED_CARD_COUNT_AT_LEAST','MIN_UNIQUE_SUITS'];
      if(numericTypes.includes(condition?.type))require(Number.isFinite(condition.value)&&condition.value>0,`${owner} 的 ${condition?.type} 必须包含正数 value`);
      if(condition?.type==='HAND_QUALITY_IS')require(['NORMAL','RARE'].includes(condition.value),`${owner} 的牌型品质条件不合法`);
      if(condition?.type==='HAND_TYPE_IS')require(typeof condition.value==='string'||VALID_VALUE_SOURCES.has(condition.valueSource),`${owner} 的 HAND_TYPE_IS 缺少合法 value/valueSource`);
      if(condition?.type==='HAND_TYPE_IN')require((Array.isArray(condition.values)&&condition.values.length>0)||VALID_VALUES_SOURCES.has(condition.valuesSource),`${owner} 的 HAND_TYPE_IN 缺少合法 values/valuesSource`);
      if(condition?.type==='PERSONA_RUNTIME_FLAG')require(typeof condition.key==='string'&&condition.key in runtimeDefaults,`${owner} 的运行时标记 ${condition?.key} 未声明默认值`);
    };
    const validateRuntimeEffect=(effect,owner,runtimeDefaults={})=>{
      require(runtimeEffectTypes.has(effect?.type),`${owner} 使用了不在运行时白名单中的效果：${effect?.type}`);
      if(['SET_RUNTIME_FLAG','CLEAR_RUNTIME_FLAG'].includes(effect?.type))require(typeof effect.key==='string'&&effect.key in runtimeDefaults,`${owner} 的运行时标记效果未引用已声明字段`);
      if(['ADD_RUNTIME_COUNTER','ADD_GROWTH_STACK'].includes(effect?.type))require(typeof effect.runtimeCounter==='string'&&effect.runtimeCounter.length>0,`${owner} 的成长效果缺少 runtimeCounter`);
    };

    require(config?.id==='TARGET_AI_PERSONA_WHITELIST_V1','AI 人格白名单必须使用 TARGET_AI_PERSONA_WHITELIST_V1');
    require(config?.schemaVersion===1,'AI 人格白名单 schemaVersion 必须为 1');
    require(config?.runtimeEnabled===false,'AI 人格 V1 白名单当前不得接入正式运行时');
    require(config?.decisionStatus==='UNDECIDED','AI 人格 V1 数值未实测前必须保持 UNDECIDED');
    require(config?.temporaryNaming?.prefix==='AI人格'&&config.temporaryNaming.sequenceStart===1&&config.temporaryNaming.minDigits===3,'AI 人格临时编号规则必须从 AI人格001 开始');

    const directionIds=unique(config?.directions,'AI 人格方向');
    require(directionIds.size===3,'AI 人格必须且只能包含桥接、破局、顺势三个内部方向');
    for(const expected of ['AI_DIRECTION_BRIDGE','AI_DIRECTION_BREAK','AI_DIRECTION_FOLLOW'])require(directionIds.has(expected),`AI 人格缺少内部方向 ${expected}`);
    for(const direction of config?.directions||[])require(direction.playerFacing===false,`内部方向 ${direction.id} 不得展示给玩家`);

    const nodePolicyIds=unique(config?.nodePolicies,'AI 人格节点策略');
    require(nodePolicyIds.size===3,'AI 人格必须配置 N04/N08/N12 三个生成节点');
    const policyByNode=new Map((config?.nodePolicies||[]).map(item=>[item.runtimeNodeId,item]));
    for(const nodeId of ['N04','N08','N12']){
      const policy=policyByNode.get(nodeId);
      require(!!policy,`AI 人格缺少节点策略 ${nodeId}`);
      require(nodesById.get(nodeId)?.type==='PERSONA_GROWTH',`AI 人格节点策略 ${nodeId} 必须指向 PERSONA_GROWTH 节点`);
      require(VALID_DIRECTION_MODES.has(policy?.directionMode),`AI 人格节点策略 ${nodeId} 的方向模式不合法`);
      require(VALID_PERSIST_SCOPES.has(policy?.persistScope),`AI 人格节点策略 ${nodeId} 的持久化作用域不合法`);
      require(policy?.playerFacing===false,`AI 人格节点策略 ${nodeId} 不得向玩家暴露内部方向`);
      for(const directionId of policy?.directionIds||[])require(directionIds.has(directionId),`AI 人格节点策略 ${nodeId} 引用了未知方向 ${directionId}`);
    }
    const earlyDirections=['AI_DIRECTION_BRIDGE','AI_DIRECTION_BREAK'].sort();
    for(const nodeId of ['N04','N08'])require(policyByNode.get(nodeId)?.directionMode==='RANDOM_SWAP_WITHOUT_REPLACEMENT'&&policyByNode.get(nodeId)?.swapGroupId==='AI_DIRECTION_SWAP_EARLY'&&JSON.stringify([...(policyByNode.get(nodeId)?.directionIds||[])].sort())===JSON.stringify(earlyDirections),`${nodeId} 必须从桥接/破局中按局随机互换且不重复`);
    require(policyByNode.get('N12')?.directionMode==='FIXED'&&JSON.stringify(policyByNode.get('N12')?.directionIds)==='["AI_DIRECTION_FOLLOW"]','N12 必须固定生成顺势人格');

    const assembly=config?.assemblyRules||{};
    require(assembly.generatedCardCountPerNode===1,'每个 AI 人格节点必须只生成一张牌');
    require(assembly.allowReroll===false,'AI 人格节点不得提供重新生成');
    require(assembly.requireGrowthPart===true&&assembly.growthPartCount===1,'每张 AI 人格必须且只能装配一个成长零件');
    require(assembly.triggerPartCount===1&&assembly.mainEffectPartCount===1,'AI 人格 V1 必须使用一个触发零件和一个主效果零件');
    require(assembly.localFallbackRequired===true&&assembly.aiMayReturnOnlyIds===true,'AI 人格必须启用本地备用结果且 AI 只能返回合法 ID');
    require(assembly.directionAssignmentStateKey==='aiPersonaDirectionByNode','AI 人格节点方向必须使用稳定的活动局存档字段');
    require(Array.isArray(assembly.mechanismFingerprintFields)&&assembly.mechanismFingerprintFields.length>=7,'AI 人格机制指纹字段不完整');

    const affix=config?.affixPolicy||{};
    require(affix.id==='AI_AFFIX_POLICY_V1','AI 人格次级属性策略 ID 不合法');
    require(affix.schemaVersion===2&&affix.slotCount===2&&affix.defaultUnlockedCount===0,'AI 人格必须预留两个默认锁定的次级属性槽');
    require(JSON.stringify(affix.unlockCosts)==='[5,8]'&&affix.allowDuplicates===false,'AI 人格次级属性槽必须沿用 5/8 金币且不可重复的基础结构');
    require(affix.candidatePoolStatus==='CONFIRMED'&&affix.runtimeEnabled===true,'AI 人格次级属性池确认后必须接入本地运行时');
    require(Array.isArray(affix.poolIds)&&affix.poolIds.length===6&&new Set(affix.poolIds).size===6,'AI 人格次级属性策略必须引用 6 条唯一词条');
    require(Array.isArray(affix.slotPoolIds?.[0])&&affix.slotPoolIds[0].length===3&&Array.isArray(affix.slotPoolIds?.[1])&&affix.slotPoolIds[1].length===3,'AI 人格第二、第三词条必须各自拥有 3 条候选');
    require(affix.disallowSameAttributeType===true,'AI 人格第二、第三词条必须启用同属性互斥');

    const anchor=config?.valueAnchor,anchorUnits=anchor?.units||{};
    const sourceItem=(shop?.items||[]).find(item=>item.id===anchor?.sourceShopItemId),sourceAmounts=sourceItem?.effect?.amountByAttributeType||{};
    require(sourceItem?.effect?.type==='UPGRADE_PERSONA_MAIN','AI 人格价值锚点必须引用现有的人格主词条强化商品');
    require(nearlyEqual(anchorUnits.ADD_CHIPS,sourceAmounts.BASE_CHIPS)&&nearlyEqual(anchorUnits.ADD_MULT,sourceAmounts.BASE_MULT)&&nearlyEqual(anchorUnits.ADD_XMULT_RATE,sourceAmounts.XMULT_RATE),'AI 人格 1 价值单位必须与现有商店人格主词条强化一致');
    require(nearlyEqual(anchorUnits.MULTIPLY_FINAL_DELTA,sourceAmounts.XMULT_RATE),'独立乘区价值单位必须映射到现有 XMULT_RATE 强化锚点');

    const tierIds=unique(config?.strengthTiers,'AI 人格强度档位'),tierById=new Map((config?.strengthTiers||[]).map(item=>[item.id,item]));
    require(tierIds.size>=4,'AI 人格强度档位不足');
    for(const tier of config?.strengthTiers||[]){
      require(Number.isFinite(tier.units)&&tier.units>0,`AI 人格强度档位 ${tier.id} 的 units 必须大于 0`);
      require(nearlyEqual(tier.values?.ADD_CHIPS,tier.units*anchorUnits.ADD_CHIPS),`AI 人格强度档位 ${tier.id} 的筹码值偏离价值锚点`);
      require(nearlyEqual(tier.values?.ADD_MULT,tier.units*anchorUnits.ADD_MULT),`AI 人格强度档位 ${tier.id} 的倍率值偏离价值锚点`);
      require(nearlyEqual(tier.values?.ADD_XMULT_RATE,tier.units*anchorUnits.ADD_XMULT_RATE),`AI 人格强度档位 ${tier.id} 的独立倍率值偏离价值锚点`);
      require(nearlyEqual(tier.values?.MULTIPLY_FINAL,1+tier.units*anchorUnits.MULTIPLY_FINAL_DELTA),`AI 人格强度档位 ${tier.id} 的最终乘数偏离价值锚点`);
    }

    const frequencyIds=unique(config?.frequencyBands,'AI 人格触发频率档位');
    for(const band of config?.frequencyBands||[]){
      require(Number.isFinite(band.estimatedTriggerRate)&&band.estimatedTriggerRate>0&&band.estimatedTriggerRate<=1,`AI 人格触发频率 ${band.id} 必须位于 0 与 1 之间`);
      require(band.tuningStatus==='PROTOTYPE_ASSUMPTION',`AI 人格触发频率 ${band.id} 必须标记为待实测假设`);
      require(Array.isArray(band.allowedBaseTierIds)&&band.allowedBaseTierIds.length>0,`AI 人格触发频率 ${band.id} 缺少可用强度档位`);
      for(const tierId of band.allowedBaseTierIds)require(tierIds.has(tierId),`AI 人格触发频率 ${band.id} 引用了未知强度档位 ${tierId}`);
    }

    const triggerIds=unique(config?.triggerParts,'AI 人格触发零件'),variantIds=new Set();
    require(triggerIds.size>=16,'AI 人格 V1 触发零件数量不足');
    for(const part of config?.triggerParts||[]){
      require(Array.isArray(part.directions)&&part.directions.length>0,`AI 人格触发零件 ${part.id} 缺少适用方向`);
      for(const directionId of part.directions||[])require(directionIds.has(directionId),`AI 人格触发零件 ${part.id} 引用了未知方向 ${directionId}`);
      require(Array.isArray(part.behaviorTags)&&part.behaviorTags.length>0,`AI 人格触发零件 ${part.id} 缺少行为标签`);
      require(typeof part.copyTemplate==='string'&&part.copyTemplate.length>0&&!part.copyTemplate.includes('条件成立'),`AI 人格触发零件 ${part.id} 缺少清晰的玩家文案模板`);
      require(Array.isArray(part.variants)&&part.variants.length>0,`AI 人格触发零件 ${part.id} 缺少具体变体`);
      for(const variant of part.variants||[]){
        require(typeof variant.id==='string'&&variant.id.length>0&&!variantIds.has(variant.id),`AI 人格触发变体 ID 无效或重复：${variant?.id}`);variantIds.add(variant.id);
        require(frequencyIds.has(variant.frequencyBandId),`AI 人格触发变体 ${variant.id} 引用了未知触发频率 ${variant.frequencyBandId}`);
        const runtimeDefaults=variant.support?.runtimeDefaults||{};
        require(Array.isArray(variant.conditions)&&variant.conditions.length>0,`AI 人格触发变体 ${variant.id} 缺少运行时条件`);
        for(const condition of variant.conditions||[])validateCondition(condition,variant.id,runtimeDefaults);
        for(const rule of variant.support?.rules||[]){require(VALID_EVENTS.has(rule.event),`AI 人格触发变体 ${variant.id} 的支持事件不合法`);for(const condition of rule.conditions||[])validateCondition(condition,variant.id,runtimeDefaults);for(const effect of rule.effects||[])validateRuntimeEffect(effect,variant.id,runtimeDefaults)}
        for(const effect of variant.support?.onTriggerEffects||[])validateRuntimeEffect(effect,variant.id,runtimeDefaults);
        for(const [key,scope] of Object.entries(variant.support?.runtimeScopes||{}))require(key in runtimeDefaults&&['HAND','BATTLE','RUN'].includes(scope),`AI 人格触发变体 ${variant.id} 的运行时作用域不合法`);
      }
    }

    const mainEffectIds=unique(config?.mainEffectParts,'AI 人格主效果零件');
    require(mainEffectIds.size===4,'AI 人格主效果必须覆盖筹码、倍率、独立倍率增量和最终乘区四类');
    for(const effect of config?.mainEffectParts||[]){
      require(['ADD_CHIPS','ADD_MULT','ADD_XMULT_RATE','MULTIPLY_FINAL'].includes(effect.runtimeType),`AI 人格主效果 ${effect.id} 的运行时类型不合法`);
      require(runtimeEffectTypes.has(effect.runtimeType),`AI 人格主效果 ${effect.id} 尚未被本地执行器支持`);
      require(typeof effect.copyTemplate==='string'&&effect.copyTemplate.length>0,`AI 人格主效果 ${effect.id} 缺少玩家文案模板`);
      require(assembly.mainAttributeTypeByEffect?.[effect.runtimeType]===effect.mainAttributeType,`AI 人格主效果 ${effect.id} 的主属性分类不一致`);
      require(Array.isArray(effect.allowedTierIds)&&effect.allowedTierIds.length>0,`AI 人格主效果 ${effect.id} 缺少强度档位`);
      for(const tierId of effect.allowedTierIds||[])require(tierIds.has(tierId),`AI 人格主效果 ${effect.id} 引用了未知强度档位 ${tierId}`);
      for(const directionId of effect.directions||[])require(directionIds.has(directionId),`AI 人格主效果 ${effect.id} 引用了未知方向 ${directionId}`);
    }

    const growthIds=unique(config?.growthParts,'AI 人格成长零件');
    require(growthIds.size>=5,'AI 人格 V1 成长零件数量不足');
    for(const growth of config?.growthParts||[]){
      require(VALID_EVENTS.has(growth.event),`AI 人格成长零件 ${growth.id} 的事件不合法`);
      require(typeof growth.copyTemplate==='string'&&growth.copyTemplate.length>0,`AI 人格成长零件 ${growth.id} 缺少玩家文案模板`);
      require(growth.frequencyBandSource==='CORE_TRIGGER'||frequencyIds.has(growth.frequencyBandId),`AI 人格成长零件 ${growth.id} 缺少合法触发频率来源`);
      require(growth.conditionSource==='CORE_TRIGGER'||Array.isArray(growth.conditions),`AI 人格成长零件 ${growth.id} 缺少条件来源`);
      for(const condition of growth.conditions||[])validateCondition(condition,growth.id,{});
      validateRuntimeEffect(growth.runtimeEffect,growth.id,{growthStacks:0});
      require(growth.runtimeEffect?.type==='ADD_GROWTH_STACK'&&growth.runtimeEffect.runtimeCounter==='growthStacks'&&growth.runtimeEffect.value===1,`AI 人格成长零件 ${growth.id} 必须按次增加 growthStacks`);
      require(Array.isArray(growth.allowedCapValues)&&growth.allowedCapValues.length>0&&growth.allowedCapValues.every(value=>Number.isInteger(value)&&value>0),`AI 人格成长零件 ${growth.id} 的成长上限不合法`);
      require(Array.isArray(growth.allowedPerStackTierIds)&&growth.allowedPerStackTierIds.length>0,`AI 人格成长零件 ${growth.id} 缺少每层强度档位`);
      for(const tierId of growth.allowedPerStackTierIds||[])require(tierIds.has(tierId),`AI 人格成长零件 ${growth.id} 引用了未知强度档位 ${tierId}`);
    }

    const budgetIds=unique(config?.numericBudgets,'AI 人格节点预算'),budgetByNode=new Map((config?.numericBudgets||[]).map(item=>[item.runtimeNodeId,item]));
    require(budgetIds.size===3,'AI 人格必须为三个生成节点分别配置数值预算');
    for(const nodeId of ['N04','N08','N12']){
      const budget=budgetByNode.get(nodeId);
      require(!!budget,`AI 人格缺少节点预算 ${nodeId}`);
      require(Number.isFinite(budget?.maxInitialExpectedUnitsPerHand)&&budget.maxInitialExpectedUnitsPerHand>0,`AI 人格节点预算 ${nodeId} 的初始上限不合法`);
      require(Number.isFinite(budget?.maxMatureExpectedUnitsPerHand)&&budget.maxMatureExpectedUnitsPerHand>budget.maxInitialExpectedUnitsPerHand,`AI 人格节点预算 ${nodeId} 的成熟上限不合法`);
      require(budget?.tuningStatus==='PROTOTYPE_ASSUMPTION',`AI 人格节点预算 ${nodeId} 必须标记为待实测假设`);
    }

    unique(config?.unresolved,'AI 人格未决事项');
    return{valid:errors.length===0,errors};
  }

  modules.aiPersonaWhitelistValidator={validate};
})(globalThis);
