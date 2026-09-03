(function(root){
  'use strict';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const round=(value,digits=6)=>Number(Number(value).toFixed(digits));
  const SCOPES={
    EQUIPPED:{weight:1,blockThreshold:.78},
    RUN_OWNED:{weight:.95,blockThreshold:.82},
    RUN_DISCARDED:{weight:.7,blockThreshold:.92},
    PERMANENT:{weight:.9,blockThreshold:.86}
  };
  const scoringEffects=new Set(['ADD_CHIPS','ADD_MULT','ADD_XMULT_RATE','MULTIPLY_FINAL']);
  function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value}
  const canonical=value=>JSON.stringify(stable(value));
  const jaccard=(left,right)=>{const a=new Set(left||[]),b=new Set(right||[]),union=new Set([...a,...b]);if(!union.size)return 1;return[...a].filter(value=>b.has(value)).length/union.size};
  const conditionTypes=conditions=>(conditions||[]).map(condition=>condition.type);
  function conditionSimilarity(left,right){const exact=canonical(left||[])===canonical(right||[]);if(exact)return 1;return round(jaccard(conditionTypes(left),conditionTypes(right))*.72)}
  function templateOf(value){return value?.runtimeTemplate||value?.template||value?.templateSnapshot||value||{}}
  function metaOf(value){return value?.aiPersonaMeta||templateOf(value)?.aiPersonaMeta||{}}
  function mechanism(value){
    const template=templateOf(value),meta=metaOf(value),growthRule=(template.growthRules||[]).find(rule=>(rule.effects||[]).some(effect=>effect.type==='ADD_GROWTH_STACK'));
    return{fingerprint:value?.mechanismFingerprint||meta.mechanismFingerprint||null,components:value?.components||meta.components||null,conditions:clone(template.conditions||[]),effectType:(template.effects||[]).find(effect=>scoringEffects.has(effect.type))?.type||null,growthEvent:growthRule?.event||null,growthConditions:clone(growthRule?.conditions||[]),behaviorTags:clone(value?.behaviorTags||meta.behaviorTags||template.tags||[])};
  }
  function compare(candidate,reference){
    const left=mechanism(candidate),right=mechanism(reference);
    if(left.fingerprint&&right.fingerprint&&left.fingerprint===right.fingerprint)return{rawScore:1,exact:true,parts:{trigger:1,effect:1,growth:1,tags:1,components:1}};
    const trigger=conditionSimilarity(left.conditions,right.conditions),effect=left.effectType&&left.effectType===right.effectType?1:0,growthEvent=left.growthEvent&&left.growthEvent===right.growthEvent?1:0,growthConditions=conditionSimilarity(left.growthConditions,right.growthConditions),growth=left.growthEvent||right.growthEvent?growthEvent*(.35+growthConditions*.65):1,tags=jaccard(left.behaviorTags,right.behaviorTags),components=left.components&&right.components?jaccard(Object.values(left.components),Object.values(right.components)):0,rawScore=round(trigger*.45+effect*.2+growth*.25+tags*.07+components*.03);
    return{rawScore,exact:false,parts:{trigger:round(trigger),effect,growth:round(growth),tags:round(tags),components:round(components)}};
  }
  function priority(scope){return{EQUIPPED:4,RUN_OWNED:3,PERMANENT:2,RUN_DISCARDED:1}[scope]||0}
  function collectReferences({personaState={},templatesById={},permanentRecords=[],discardedTemplates=[]}={}){
    const templates=templatesById instanceof Map?templatesById:new Map(Object.entries(templatesById||{})),dynamic=personaState.dynamicPersonaTemplatesById||{},equipped=new Set((personaState.equippedPersonaInstanceIds||[]).filter(Boolean)),byIdentity=new Map(),add=entry=>{if(!entry?.template)return;const existing=byIdentity.get(entry.identity);if(!existing||priority(entry.scope)>priority(existing.scope))byIdentity.set(entry.identity,entry)};
    for(const instanceId of personaState.runPersonaPool||[]){const instance=personaState.personaInstancesById?.[instanceId],template=instance&&(dynamic[instance.templateId]||templates.get(instance.templateId));if(template)add({identity:`INSTANCE:${instanceId}`,referenceId:instanceId,scope:equipped.has(instanceId)?'EQUIPPED':'RUN_OWNED',template:clone(template),runsSinceLastUsed:0})}
    for(const [index,item] of discardedTemplates.entries()){const template=item?.template||item;if(template)add({identity:`DISCARDED:${item?.referenceId||template.id||index}`,referenceId:item?.referenceId||template.id||`DISCARDED_${index}`,scope:'RUN_DISCARDED',template:clone(template),runsSinceLastUsed:0})}
    for(const record of permanentRecords||[]){const template=record.templateSnapshot||templates.get(record.templateId);if(template)add({identity:`PERMANENT:${record.collectionId||record.cardId||record.templateId}`,referenceId:record.collectionId||record.cardId||record.templateId,scope:'PERMANENT',template:clone(template),runsSinceLastUsed:Number.isFinite(record.runsSinceLastUsed)?record.runsSinceLastUsed:null})}
    return[...byIdentity.values()].sort((a,b)=>priority(b.scope)-priority(a.scope)||String(a.referenceId).localeCompare(String(b.referenceId)));
  }
  function filterPool(pool,{references=[],maxCandidates=12,allowDormantQualityVariant=false}={}){
    if(!pool?.candidates||!Array.isArray(pool.candidates))throw new Error('AI persona similarity requires a candidate pool');
    if(!Number.isInteger(maxCandidates)||maxCandidates<1)throw new Error('AI persona similarity maxCandidates must be a positive integer');
    const accepted=[],rejected=[];
    for(const source of pool.candidates){
      const matches=references.filter(reference=>SCOPES[reference.scope]).map(reference=>{const comparison=compare(source,reference),policy=SCOPES[reference.scope],dormant=reference.scope==='PERMANENT'&&Number(reference.runsSinceLastUsed)>=3,qualityException=allowDormantQualityVariant&&dormant&&source.qualityUpgradeApproved===true;return{referenceId:reference.referenceId,scope:reference.scope,runsSinceLastUsed:reference.runsSinceLastUsed,weightedScore:round(comparison.rawScore*policy.weight),blocked:(comparison.exact||comparison.rawScore>=policy.blockThreshold)&&!qualityException,...comparison}}).sort((a,b)=>Number(b.blocked)-Number(a.blocked)||b.weightedScore-a.weightedScore||String(a.referenceId).localeCompare(String(b.referenceId))),blocking=matches.find(item=>item.blocked),maxWeightedScore=matches[0]?.weightedScore||0,candidate={...clone(source),similarity:{maxWeightedScore,closestMatches:matches.slice(0,3)},adjustedRankScore:round(Number(source.rankScore||0)-maxWeightedScore*30)};
      if(blocking)rejected.push({...candidate,rejection:{reason:blocking.exact?'EXACT_MECHANISM_DUPLICATE':'TOO_SIMILAR_TO_EXISTING_PERSONA',referenceId:blocking.referenceId,scope:blocking.scope,rawScore:blocking.rawScore}});else accepted.push(candidate);
    }
    accepted.sort((a,b)=>b.adjustedRankScore-a.adjustedRankScore||a.id.localeCompare(b.id));
    return clone({schemaVersion:1,id:`AI_SIMILARITY_RESULT_V1:${pool.runtimeNodeId}:${pool.directionId}`,runtimeNodeId:pool.runtimeNodeId,directionId:pool.directionId,sourceCandidateCount:pool.candidates.length,acceptedCount:accepted.length,rejectedCount:rejected.length,candidates:accepted.slice(0,maxCandidates),rejected});
  }
  root.AiPersonaSimilarity=Object.freeze({SCOPES,compare,collectReferences,filterPool,mechanism});
})(globalThis);
