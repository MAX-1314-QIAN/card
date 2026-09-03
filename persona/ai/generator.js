(function(root){
  'use strict';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const EARLY=['AI_DIRECTION_BRIDGE','AI_DIRECTION_BREAK'];
  function create(whitelist){
    if(!root.AiPersonaCandidateBuilder||!root.AiPersonaSimilarity||!root.AiPersonaTemplateFactory)throw new Error('AI persona generator dependencies are missing');
    const builder=root.AiPersonaCandidateBuilder.create(whitelist),factory=root.AiPersonaTemplateFactory.create(whitelist),policyByNode=new Map((whitelist.nodePolicies||[]).map(item=>[item.runtimeNodeId,item]));
    function assignDirection({runtimeNodeId,assignments={},randomValue=0}={}){
      const policy=policyByNode.get(runtimeNodeId);if(!policy)throw new Error(`Unknown AI persona node: ${runtimeNodeId}`);
      const next=clone(assignments||{}),existing=next[runtimeNodeId];if(existing){if(!policy.directionIds.includes(existing))throw new Error(`Saved AI persona direction is invalid at ${runtimeNodeId}`);return{directionId:existing,assignments:next,created:false}}
      if(policy.directionMode==='FIXED'){next[runtimeNodeId]=policy.directionIds[0];return{directionId:next[runtimeNodeId],assignments:next,created:true}}
      const otherNode=runtimeNodeId==='N04'?'N08':'N04',other=next[otherNode];
      if(other&&EARLY.includes(other)){next[runtimeNodeId]=EARLY.find(id=>id!==other);return{directionId:next[runtimeNodeId],assignments:next,created:true}}
      const order=Number(randomValue)>=.5?[EARLY[1],EARLY[0]]:EARLY;next.N04=order[0];next.N08=order[1];return{directionId:next[runtimeNodeId],assignments:next,created:true};
    }
    function libraryFallback(fallbackTemplates,runtimeNodeId,references){
      const ranked=(fallbackTemplates||[]).filter(item=>item?.id).map(template=>({template,maxSimilarity:(references||[]).reduce((max,reference)=>Math.max(max,root.AiPersonaSimilarity.compare(template,reference).rawScore),0)})).sort((a,b)=>a.maxSimilarity-b.maxSimilarity||a.template.id.localeCompare(b.template.id)),selected=ranked.find(item=>item.maxSimilarity<.95);
      return selected?{ok:true,kind:'LIBRARY_PERSONA',reason:'NO_DISTINCT_LOCAL_CANDIDATE',runtimeNodeId,templateId:selected.template.id,template:clone(selected.template),maxSimilarity:selected.maxSimilarity}:{ok:false,kind:'NO_RESULT',reason:'NO_DISTINCT_LOCAL_OR_LIBRARY_CANDIDATE',runtimeNodeId};
    }
    function prepare({snapshot,directionId,handTypes=[],references=[],maxCandidates=12}={}){
      const rawPool=builder.build({snapshot,directionId,handTypes,maxCandidates:24}),filtered=root.AiPersonaSimilarity.filterPool(rawPool,{references,maxCandidates});
      return{runtimeNodeId:snapshot?.runtimeNodeId,snapshotId:snapshot?.id||null,directionId,rawPool,filtered};
    }
    function generate({snapshot,directionId,handTypes=[],references=[],selectedCandidateId=null,sequenceNumber,portrait=null,fallbackTemplates=[],maxCandidates=12,prepared=null}={}){
      const preparedPool=prepared||prepare({snapshot,directionId,handTypes,references,maxCandidates}),{rawPool,filtered}=preparedPool;
      if(!filtered.candidates.length)return libraryFallback(fallbackTemplates,snapshot?.runtimeNodeId,references);
      const selected=filtered.candidates.find(candidate=>candidate.id===selectedCandidateId)||filtered.candidates[0],selectionSource=selectedCandidateId&&selected.id===selectedCandidateId?'AI_SELECTED':'LOCAL_FALLBACK',template=factory.fromCandidate(selected,{sequenceNumber,portrait});
      return{ok:true,kind:'GENERATED_PERSONA',reason:selectionSource==='LOCAL_FALLBACK'?(selectedCandidateId?'INVALID_AI_SELECTION':'NO_AI_SELECTION'):null,runtimeNodeId:snapshot.runtimeNodeId,directionId,selectionSource,selectedCandidateId:selected.id,template,candidate:clone(selected),trace:{snapshotId:snapshot.id,rawCandidateCount:rawPool.candidateCount,distinctCandidateCount:filtered.acceptedCount,rejectedSimilarityCount:filtered.rejectedCount}};
    }
    return Object.freeze({assignDirection,prepare,generate});
  }
  root.AiPersonaGenerator=Object.freeze({create});
})(globalThis);
