(function(root){
  'use strict';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  function create(whitelist,{generator}={}){
    const runtimeGenerator=generator||root.AiPersonaGenerator?.create(whitelist);
    if(!runtimeGenerator?.prepare||!runtimeGenerator?.generate||!root.AiPersonaBehaviorSnapshot?.assertValid)throw new Error('AI persona generator service dependency is missing');
    function assignDirection(options){return runtimeGenerator.assignDirection(options)}
    function prepare(options={}){
      const safeSnapshot=root.AiPersonaBehaviorSnapshot.assertValid(options.snapshot),generationInput={...options,snapshot:safeSnapshot},preparedPool=runtimeGenerator.prepare(generationInput),requestId=`AI_PERSONA_SELECTION_V1:${safeSnapshot.runtimeNodeId}:${safeSnapshot.id}`,candidates=(preparedPool.filtered?.candidates||[]).map(candidate=>({id:candidate.id,playerCopy:clone(candidate.playerCopy),behaviorTags:clone(candidate.behaviorTags||[]),budget:clone(candidate.budget||null)}));
      const request={schemaVersion:1,requestId,runtimeNodeId:safeSnapshot.runtimeNodeId,directionId:options.directionId,behaviorSnapshot:safeSnapshot,candidateIds:candidates.map(candidate=>candidate.id),candidates};
      return{schemaVersion:1,request,generationInput:clone(generationInput),preparedPool};
    }
    function selectedIdFrom(preparation,response){
      if(!response||typeof response!=='object')return null;
      if(JSON.stringify(Object.keys(response).sort())!==JSON.stringify(['requestId','selectedCandidateId'])||response.requestId!==preparation.request.requestId||typeof response.selectedCandidateId!=='string')return'__INVALID_AI_SELECTION__';
      return preparation.request.candidateIds.includes(response.selectedCandidateId)?response.selectedCandidateId:'__INVALID_AI_SELECTION__';
    }
    function finalize(preparation,response=null){
      if(!preparation?.request||!preparation?.preparedPool)throw new Error('AI persona selection preparation is invalid');
      const selectedCandidateId=selectedIdFrom(preparation,response),result=runtimeGenerator.generate({...preparation.generationInput,prepared:preparation.preparedPool,selectedCandidateId});
      return{...result,selectionEnvelope:{schemaVersion:1,requestId:preparation.request.requestId,responseAccepted:result.selectionSource==='AI_SELECTED',fallbackUsed:result.selectionSource!=='AI_SELECTED'}};
    }
    function generateLocal(options){return finalize(prepare(options),null)}
    return Object.freeze({assignDirection,prepare,finalize,generateLocal});
  }
  root.AiPersonaGenerationService=Object.freeze({create});
})(globalThis);
