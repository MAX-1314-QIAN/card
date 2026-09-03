(function(root){
  'use strict';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const safe=value=>String(value||'AI').replace(/[^a-zA-Z0-9_-]/g,'_');
  function create(whitelist){
    if(!whitelist||whitelist.id!=='TARGET_AI_PERSONA_WHITELIST_V1')throw new Error('AI persona template factory requires the V1 whitelist');
    const effectById=new Map((whitelist.mainEffectParts||[]).map(item=>[item.id,item]));
    function fromCandidate(candidate,{sequenceNumber,portrait=null,templateId=null}={}){
      if(!candidate||candidate.status!=='LOCAL_LEGAL_CANDIDATE')throw new Error('AI persona template factory requires a legal candidate');
      if(!Number.isInteger(sequenceNumber)||sequenceNumber<whitelist.temporaryNaming.sequenceStart)throw new Error('AI persona sequenceNumber is invalid');
      const number=String(sequenceNumber).padStart(whitelist.temporaryNaming.minDigits,'0'),name=`${whitelist.temporaryNaming.prefix}${number}`,effect=effectById.get(candidate.components.mainEffectPartId),runtime=clone(candidate.runtimeTemplate);
      if(!effect)throw new Error('AI persona candidate main effect is unknown');
      return{
        id:templateId||`AI_PERSONA_${number}_${safe(candidate.id).slice(-14)}`,
        displayId:name,
        name,
        code:`AI_PERSONA_${number}`,
        entryId:null,
        mainAttributeId:effect.mainAttributeType,
        mainEntry:candidate.playerCopy.trigger,
        mode:'人格',
        mainEffect:{triggerText:candidate.playerCopy.trigger,effectText:candidate.playerCopy.mainEffect,growthText:candidate.playerCopy.growth},
        conditions:runtime.conditions,
        effects:runtime.effects,
        qualityId:'PROTOTYPE',
        behaviorFamilyId:null,
        activationLimit:runtime.activationLimit,
        growthRules:runtime.growthRules,
        caps:runtime.caps,
        runtimeDefaults:runtime.runtimeDefaults,
        runtimeScopes:runtime.runtimeScopes,
        subAffixRules:{id:whitelist.affixPolicy.id,schemaVersion:whitelist.affixPolicy.schemaVersion,slotCount:whitelist.affixPolicy.slotCount,defaultUnlockedCount:whitelist.affixPolicy.defaultUnlockedCount,unlockCosts:clone(whitelist.affixPolicy.unlockCosts),poolIds:[],allowDuplicates:whitelist.affixPolicy.allowDuplicates,candidatePoolStatus:whitelist.affixPolicy.candidatePoolStatus,maxAttributeCount:3,maxSubAttributeCount:2},
        tags:['AI人格'],
        decisionStatus:'PROTOTYPE_ASSUMPTION',
        tone:'#725A3A',
        portrait,
        aiPersonaMeta:{schemaVersion:1,playerFacing:false,sourceCandidateId:candidate.id,runtimeNodeId:candidate.runtimeNodeId,internalDirectionId:candidate.directionId,mechanismFingerprint:candidate.mechanismFingerprint,components:clone(candidate.components),behaviorTags:clone(candidate.behaviorTags),budgetMetrics:clone(candidate.budgetMetrics),playerCopy:clone(candidate.playerCopy)}
      };
    }
    return Object.freeze({fromCandidate});
  }
  root.AiPersonaTemplateFactory=Object.freeze({create});
})(globalThis);
