(function(root){
  'use strict';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const round=(value,digits=6)=>Number(Number(value).toFixed(digits));
  const clamp=value=>Math.max(0,Math.min(1,Number(value)));

  function create(whitelist){
    if(!whitelist||whitelist.id!=='TARGET_AI_PERSONA_WHITELIST_V1')throw new Error('AI persona value budget requires the V1 whitelist');
    const tierById=new Map((whitelist.strengthTiers||[]).map(item=>[item.id,item])),frequencyById=new Map((whitelist.frequencyBands||[]).map(item=>[item.id,item])),effectById=new Map((whitelist.mainEffectParts||[]).map(item=>[item.id,item])),growthById=new Map((whitelist.growthParts||[]).map(item=>[item.id,item])),budgetByNode=new Map((whitelist.numericBudgets||[]).map(item=>[item.runtimeNodeId,item]));

    function effectiveRate(configuredRate,observedRate,confidence='LOW'){
      const configured=clamp(configuredRate);
      if(!Number.isFinite(observedRate))return configured;
      const observed=clamp(observedRate),observedWeight={LOW:0,MEDIUM:.5,HIGH:.75}[confidence]??0;
      return round(configured*(1-observedWeight)+observed*observedWeight);
    }

    function evaluate({runtimeNodeId,triggerFrequencyBandId,mainEffectPartId,baseStrengthTierId,growthPartId,growthStrengthTierId,growthCap,observedTriggerRate,observedGrowthRate,confidence='LOW'}={}){
      const errors=[],effect=effectById.get(mainEffectPartId),baseTier=tierById.get(baseStrengthTierId),growth=growthById.get(growthPartId),growthTier=tierById.get(growthStrengthTierId),triggerFrequency=frequencyById.get(triggerFrequencyBandId),growthFrequency=growth?.frequencyBandSource==='CORE_TRIGGER'?triggerFrequency:frequencyById.get(growth?.frequencyBandId),nodeBudget=budgetByNode.get(runtimeNodeId);
      if(!nodeBudget)errors.push('UNKNOWN_NODE_BUDGET');
      if(!effect)errors.push('UNKNOWN_MAIN_EFFECT');
      if(!baseTier)errors.push('UNKNOWN_BASE_TIER');
      if(!growth)errors.push('UNKNOWN_GROWTH_PART');
      if(!growthTier)errors.push('UNKNOWN_GROWTH_TIER');
      if(!triggerFrequency)errors.push('UNKNOWN_TRIGGER_FREQUENCY');
      if(!growthFrequency)errors.push('UNKNOWN_GROWTH_FREQUENCY');
      if(effect&&!effect.allowedTierIds.includes(baseStrengthTierId))errors.push('BASE_TIER_NOT_ALLOWED_FOR_EFFECT');
      if(triggerFrequency&&!triggerFrequency.allowedBaseTierIds.includes(baseStrengthTierId))errors.push('BASE_TIER_NOT_ALLOWED_FOR_FREQUENCY');
      if(growth&&!growth.allowedPerStackTierIds.includes(growthStrengthTierId))errors.push('GROWTH_TIER_NOT_ALLOWED');
      if(growth&&!growth.allowedCapValues.includes(growthCap))errors.push('GROWTH_CAP_NOT_ALLOWED');
      if(errors.length)return{valid:false,errors};

      const triggerRate=effectiveRate(triggerFrequency.estimatedTriggerRate,observedTriggerRate,confidence),growthRate=effectiveRate(growthFrequency.estimatedTriggerRate,observedGrowthRate,confidence),baseUnits=baseTier.units,growthUnitsPerStack=growthTier.units,cap=Number(growthCap),initialExpectedUnitsPerHand=round(baseUnits*triggerRate),matureExpectedUnitsPerHand=round((baseUnits+growthUnitsPerStack*cap)*triggerRate),growthUnitsEarnedPerHand=round(growthUnitsPerStack*growthRate),estimatedHandsToCap=growthRate>0?round(cap/growthRate,2):null;
      if(initialExpectedUnitsPerHand>nodeBudget.maxInitialExpectedUnitsPerHand+1e-9)errors.push('INITIAL_BUDGET_EXCEEDED');
      if(matureExpectedUnitsPerHand>nodeBudget.maxMatureExpectedUnitsPerHand+1e-9)errors.push('MATURE_BUDGET_EXCEEDED');
      return{
        valid:errors.length===0,
        errors,
        runtimeNodeId,
        triggerRate,
        growthRate,
        baseUnits,
        growthUnitsPerStack,
        growthCap:cap,
        initialExpectedUnitsPerHand,
        matureExpectedUnitsPerHand,
        growthUnitsEarnedPerHand,
        estimatedHandsToCap,
        initialBudgetUtilization:round(initialExpectedUnitsPerHand/nodeBudget.maxInitialExpectedUnitsPerHand),
        matureBudgetUtilization:round(matureExpectedUnitsPerHand/nodeBudget.maxMatureExpectedUnitsPerHand),
        budget:clone(nodeBudget)
      };
    }

    return Object.freeze({evaluate,effectiveRate,getTier:id=>clone(tierById.get(id)||null),getFrequency:id=>clone(frequencyById.get(id)||null),getEffect:id=>clone(effectById.get(id)||null),getGrowth:id=>clone(growthById.get(id)||null),getNodeBudget:id=>clone(budgetByNode.get(id)||null)});
  }

  root.AiPersonaValueBudget=Object.freeze({create});
})(globalThis);
