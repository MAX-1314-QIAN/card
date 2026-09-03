(function(root){
  'use strict';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const round=(value,digits=6)=>Number(Number(value).toFixed(digits));
  const containsFunction=(value,seen=new Set())=>{if(typeof value==='function')return true;if(!value||typeof value!=='object'||seen.has(value))return false;seen.add(value);return Object.values(value).some(child=>containsFunction(child,seen))};
  const containsDynamicSource=value=>{if(!value||typeof value!=='object')return false;if(Object.prototype.hasOwnProperty.call(value,'valueSource')||Object.prototype.hasOwnProperty.call(value,'valuesSource'))return true;return Object.values(value).some(containsDynamicSource)};
  function fingerprint(candidate){
    const components=candidate?.components||{};
    return JSON.stringify({triggerPartId:components.triggerPartId,triggerVariantId:components.triggerVariantId,resolvedConditions:candidate?.runtimeTemplate?.conditions||[],mainEffectPartId:components.mainEffectPartId,baseStrengthTierId:components.baseStrengthTierId,growthPartId:components.growthPartId,growthConditions:candidate?.runtimeTemplate?.growthRules?.[0]?.conditions||[],growthStrengthTierId:components.growthStrengthTierId,growthCap:components.growthCap,behaviorTags:[...(candidate?.behaviorTags||[])].sort()});
  }

  function create(whitelist){
    if(!whitelist||whitelist.id!=='TARGET_AI_PERSONA_WHITELIST_V1')throw new Error('AI persona candidate validator requires the V1 whitelist');
    const directionById=new Map((whitelist.directions||[]).map(item=>[item.id,item])),policyByNode=new Map((whitelist.nodePolicies||[]).map(item=>[item.runtimeNodeId,item])),triggerById=new Map((whitelist.triggerParts||[]).map(item=>[item.id,item])),effectById=new Map((whitelist.mainEffectParts||[]).map(item=>[item.id,item])),growthById=new Map((whitelist.growthParts||[]).map(item=>[item.id,item])),tierById=new Map((whitelist.strengthTiers||[]).map(item=>[item.id,item])),valueBudget=root.AiPersonaValueBudget.create(whitelist);

    function validate(candidate){
      const errors=[],require=(condition,message)=>{if(!condition)errors.push(message)},components=candidate?.components||{},template=candidate?.runtimeTemplate||{},direction=directionById.get(candidate?.directionId),policy=policyByNode.get(candidate?.runtimeNodeId),trigger=triggerById.get(components.triggerPartId),variant=trigger?.variants?.find(item=>item.id===components.triggerVariantId),effect=effectById.get(components.mainEffectPartId),baseTier=tierById.get(components.baseStrengthTierId),growth=growthById.get(components.growthPartId),growthTier=tierById.get(components.growthStrengthTierId);
      require(candidate?.schemaVersion===1,'候选 schemaVersion 必须为 1');
      require(typeof candidate?.id==='string'&&candidate.id.startsWith('AI_CANDIDATE_V1_'),'候选 ID 不合法');
      require(candidate?.status==='LOCAL_LEGAL_CANDIDATE','候选状态不合法');
      require(!!direction,'候选引用未知内部方向');
      require(!!policy&&policy.directionIds.includes(candidate?.directionId),'候选方向不适用于当前生成节点');
      require(!!trigger&&trigger.directions.includes(candidate?.directionId),'候选触发零件不适用于内部方向');
      require(!!variant,'候选引用未知触发变体');
      require(!!effect&&effect.directions.includes(candidate?.directionId),'候选主效果不适用于内部方向');
      require(!!baseTier&&effect?.allowedTierIds.includes(components.baseStrengthTierId),'候选主效果强度档位不合法');
      require(!!growth&&!!growthTier,'候选成长零件或成长强度档位不存在');
      require(growth?.allowedPerStackTierIds.includes(components.growthStrengthTierId),'候选每层成长强度档位不合法');
      require(growth?.allowedCapValues.includes(components.growthCap),'候选成长层数上限不合法');
      require(Array.isArray(template.conditions)&&template.conditions.length>0,'候选缺少已解析触发条件');
      require(!containsDynamicSource(template),'候选仍包含未解析的行为动态来源');
      require(!containsFunction(candidate),'候选不得包含可执行函数');
      require(template.runtimeDefaults?.growthStacks===0&&template.runtimeScopes?.growthStacks==='RUN','候选成长层数必须按局保存并从 0 开始');
      require(template.caps?.growthStacks===components.growthCap,'候选成长上限与组件选择不一致');
      require(template.activationLimit?.scope==='HAND'&&template.activationLimit?.count===1,'候选每手最多触发一次');
      const baseEffect=template.effects?.[0],stackEffect=template.effects?.[1],expectedBaseValue=baseTier?.values?.[effect?.runtimeType],growthEffectType=whitelist.assemblyRules.growthEffectTypeByMainEffect?.[effect?.runtimeType],expectedGrowthValue=growthTier?.values?.[growthEffectType];
      require(baseEffect?.type===effect?.runtimeType&&Math.abs(Number(baseEffect?.value)-Number(expectedBaseValue))<1e-9,'候选基础效果没有使用价值锚定档位');
      require(stackEffect?.type===growthEffectType&&stackEffect?.runtimeCounter==='growthStacks'&&Math.abs(Number(stackEffect?.valuePerStack)-Number(expectedGrowthValue))<1e-9,'候选成长效果没有使用正确的主词条映射');
      require(template.growthRules?.[0]?.effects?.[0]?.type==='ADD_GROWTH_STACK','候选缺少正式成长规则');
      const budget=valueBudget.evaluate({runtimeNodeId:candidate?.runtimeNodeId,triggerFrequencyBandId:variant?.frequencyBandId,mainEffectPartId:components.mainEffectPartId,baseStrengthTierId:components.baseStrengthTierId,growthPartId:components.growthPartId,growthStrengthTierId:components.growthStrengthTierId,growthCap:components.growthCap,observedTriggerRate:candidate?.observations?.triggerRate,observedGrowthRate:candidate?.observations?.growthRate,confidence:candidate?.observations?.confidence});
      require(budget.valid,`候选超出节点数值预算：${budget.errors.join(',')}`);
      if(budget.valid){require(Math.abs(round(budget.initialExpectedUnitsPerHand)-round(candidate?.budgetMetrics?.initialExpectedUnitsPerHand))<1e-9,'候选初始预算结果与本地复算不一致');require(Math.abs(round(budget.matureExpectedUnitsPerHand)-round(candidate?.budgetMetrics?.matureExpectedUnitsPerHand))<1e-9,'候选成熟预算结果与本地复算不一致')}
      const expectedFingerprint=fingerprint(candidate);
      require(candidate?.mechanismFingerprint===expectedFingerprint,'候选机制指纹与实际配置不一致');
      require(Array.isArray(candidate?.behaviorTags)&&candidate.behaviorTags.length>0,'候选缺少行为标签');
      for(const field of ['trigger','mainEffect','growth','summary'])require(typeof candidate?.playerCopy?.[field]==='string'&&candidate.playerCopy[field].length>0&&!candidate.playerCopy[field].includes('{'),`候选玩家文案 ${field} 未完整生成`);
      require(!/顺势|桥接|破局/.test(Object.values(candidate?.playerCopy||{}).join('')),'内部方向标签不得出现在玩家文案中');
      return{valid:errors.length===0,errors,budget:clone(budget)};
    }

    function assertValid(candidate){const result=validate(candidate);if(!result.valid)throw new Error(`AI 人格候选校验失败：\n${result.errors.join('\n')}`);return clone(candidate)}
    return Object.freeze({validate,assertValid,fingerprint});
  }

  root.AiPersonaCandidateValidator=Object.freeze({create});
})(globalThis);
