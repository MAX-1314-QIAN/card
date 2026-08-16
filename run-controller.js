(function(root){
  'use strict';
  const manifest=root.PERSONA_BALANCE_MANIFEST;
  if(!manifest)throw new Error('Run Controller requires PERSONA_BALANCE_MANIFEST');
  const RUN_END='RUN_END',TRANSITION_VERSION=1,handlers=new Map();
  let state=null,onRunFinished=null;
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const templateById=id=>manifest.runTemplates.find(item=>item.id===id)||null;
  const nodeById=id=>manifest.stageNodes.find(item=>item.id===id)||null;
  const currentTemplate=()=>state?templateById(state.runTemplateId):null;
  const currentNode=()=>state?nodeById(state.currentNodeId):null;
  function assertTemplate(id){const template=templateById(id);if(!template)throw new Error(`Unknown Run Template: ${id}`);const sliceAllowed=template.developmentOnly&&id==='RUN_TEMPLATE_PERSONA_SLICE'&&manifest.featureFlags.personaSliceRunEnabled,targetAllowed=template.developmentOnly&&id==='RUN_TEMPLATE_TARGET'&&manifest.featureFlags.targetRunTemplateEnabled;if(id!==manifest.activeRunTemplateId&&!sliceAllowed&&!targetAllowed)throw new Error(`Run Template is not enabled: ${id}`);return template}
  function assertNode(template,id){if(!template.nodeIds.includes(id))throw new Error(`Node ${id} does not belong to ${template.id}`);const node=nodeById(id);if(!node)throw new Error(`Unknown node: ${id}`);return node}
  function battleIndexFor(template,nodeId,fallback=0){const battles=template.nodeIds.map(nodeById).filter(node=>node?.type==='BATTLE');const index=battles.findIndex(node=>node.id===nodeId);return index<0?fallback:index}
  function runtimeFor(nodeId){if(!state.nodeRuntimeById[nodeId])state.nodeRuntimeById[nodeId]={entered:false,completed:false,completionResult:null,appliedEffectIds:[],data:{}};return state.nodeRuntimeById[nodeId]}
  function callHandler(method,node,context={}){const handler=handlers.get(node.type);return handler&&typeof handler[method]==='function'?handler[method]({node,state:clone(state),runtime:clone(runtimeFor(node.id)),...context}):undefined}
  function emptyTargetMetrics(){return{runTotalScore:0,maxSingleHandScore:0,battleScores:[],battleTargetScores:[],handsPlayedByNode:{},discardsUsedByNode:{},personaTriggersByInstance:{},personaEquipHistory:[],generatedPersonaInstanceIds:[],battleDurationMs:{},growthNodeDurationMs:{},totalRunDurationMs:0,rawEvents:[]}}
  function startRun(runTemplateId=manifest.activeRunTemplateId){const template=assertTemplate(runTemplateId);state={runTemplateId:template.id,currentNodeId:null,nodeStatus:'NOT_ENTERED',completedNodeIds:[],battleIndexCompat:0,runStartedAt:Date.now(),runEndedAt:null,transitionVersion:TRANSITION_VERSION,nodeRuntimeById:{},personaInstancesById:{},runPersonaPool:[],equippedPersonaInstanceIds:[null,null,null,null],dynamicPersonaTemplatesById:{},personaHistory:{usedHandTypes:[],previousHandType:null,sameHandTypeStreak:0},runMetrics:template.id==='RUN_TEMPLATE_TARGET'?emptyTargetMetrics():null,runResult:template.id==='RUN_TEMPLATE_TARGET'?{initialPersonaTemplateIds:[],selectedCarryOutPersonaInstanceId:null,devCollectionStub:[]}:null};return enterNode(template.startNodeId)}
  function enterNode(nodeId){
    if(!state)throw new Error('Run has not started');const template=currentTemplate(),node=assertNode(template,nodeId),runtime=runtimeFor(nodeId);
    if(state.currentNodeId===nodeId&&runtime.entered&&!runtime.completed)return{entered:false,duplicate:true,node:clone(node),state:clone(state)};
    if(runtime.completed)throw new Error(`Cannot re-enter completed node: ${nodeId}`);
    state.currentNodeId=nodeId;state.nodeStatus='ENTERED';state.battleIndexCompat=battleIndexFor(template,nodeId,state.battleIndexCompat);runtime.entered=true;runtime.enteredAt=runtime.enteredAt||Date.now();
    callHandler('enter',node,{restoring:false});if(state.nodeStatus==='ENTERED')state.nodeStatus='IN_PROGRESS';return{entered:true,duplicate:false,node:clone(node),state:clone(state)};
  }
  function resolveTransition(node,result){if(!node||!result||typeof result.type!=='string')return null;return clone((node.transitions||[]).find(item=>item.on===result.type)||null)}
  function completeNode(result){
    if(!state||state.nodeStatus==='RUN_COMPLETED')return{completed:false,duplicate:true,finished:state?.nodeStatus==='RUN_COMPLETED'};const node=currentNode();if(!node)throw new Error('Current node is missing');const runtime=runtimeFor(node.id);
    if(runtime.completed)return{completed:false,duplicate:true,result:clone(runtime.completionResult),state:clone(state)};
    if(result?.nodeId&&result.nodeId!==node.id)return{completed:false,rejected:true,reason:'STALE_NODE_RESULT',expectedNodeId:node.id,resultNodeId:result.nodeId,state:clone(state)};
    const transition=resolveTransition(node,result);if(!transition)return{completed:false,rejected:true,reason:'NO_TRANSITION',nodeId:node.id,resultType:result?.type,state:clone(state)};
    runtime.completed=true;runtime.completedAt=Date.now();runtime.completionResult=clone(result);state.nodeStatus='COMPLETED';if(!state.completedNodeIds.includes(node.id))state.completedNodeIds.push(node.id);
    callHandler('complete',node,{result:clone(result)});callHandler('cleanup',node,{result:clone(result)});if(transition.to===RUN_END)return finishRun({type:'NODE_COMPLETED',nodeId:node.id,result:clone(result)});return transitionTo(transition.to,{fromNodeId:node.id,result:clone(result)});
  }
  function transitionTo(nodeId,context={}){const entered=enterNode(nodeId);return{completed:true,transitioned:true,to:nodeId,...entered,context}}
  function finishRun(result={type:'RUN_FINISHED'}){if(!state)return{finished:false};if(state.nodeStatus==='RUN_COMPLETED')return{finished:true,duplicate:true,state:clone(state)};state.nodeStatus='RUN_COMPLETED';state.runEndedAt=Date.now();state.finishResult=clone(result);const snapshot=clone(state);if(typeof onRunFinished==='function')onRunFinished(snapshot,clone(result));return{finished:true,duplicate:false,state:snapshot}}
  function restoreRun(savedState,context={}){
    const incoming=clone(savedState);if(!incoming||typeof incoming!=='object')throw new Error('Invalid Run State');const template=assertTemplate(incoming.runTemplateId),node=assertNode(template,incoming.currentNodeId);for(const id of incoming.completedNodeIds||[])assertNode(template,id);
    state={...incoming,transitionVersion:incoming.transitionVersion||TRANSITION_VERSION,nodeRuntimeById:incoming.nodeRuntimeById||{},personaInstancesById:incoming.personaInstancesById||{},runPersonaPool:incoming.runPersonaPool||[],equippedPersonaInstanceIds:incoming.equippedPersonaInstanceIds||[null,null,null,null],dynamicPersonaTemplatesById:incoming.dynamicPersonaTemplatesById||{},personaHistory:incoming.personaHistory||{usedHandTypes:[],previousHandType:null,sameHandTypeStreak:0},runMetrics:incoming.runMetrics??(template.id==='RUN_TEMPLATE_TARGET'?emptyTargetMetrics():null),runResult:incoming.runResult??(template.id==='RUN_TEMPLATE_TARGET'?{initialPersonaTemplateIds:[],selectedCarryOutPersonaInstanceId:null,devCollectionStub:[]}:null)};const runtime=runtimeFor(node.id);runtime.entered=true;if(runtime.completed||(state.completedNodeIds||[]).includes(node.id))throw new Error(`Cannot restore completed current node: ${node.id}`);
    state.nodeStatus='IN_PROGRESS';state.battleIndexCompat=battleIndexFor(template,node.id,state.battleIndexCompat||0);callHandler('restore',node,{restoring:true,...context});return{restored:true,node:clone(node),state:clone(state)};
  }
  function registerNodeHandler(type,handler){if(typeof type!=='string'||!handler||typeof handler!=='object')throw new Error('Invalid node handler');handlers.set(type,handler);return api}
  function setFinishHandler(handler){onRunFinished=typeof handler==='function'?handler:null;return api}
  function setNodeRuntime(patch){if(!state||!state.currentNodeId)return null;const runtime=runtimeFor(state.currentNodeId);runtime.data={...(runtime.data||{}),...clone(patch)};return clone(runtime.data)}
  function getPersonaRuntimeState(){if(!state)return null;return clone({personaInstancesById:state.personaInstancesById||{},runPersonaPool:state.runPersonaPool||[],equippedPersonaInstanceIds:state.equippedPersonaInstanceIds||[null,null,null,null],dynamicPersonaTemplatesById:state.dynamicPersonaTemplatesById||{},personaHistory:state.personaHistory||{usedHandTypes:[],previousHandType:null,sameHandTypeStreak:0}})}
  function setPersonaRuntimeState(personaState){if(!state)throw new Error('Run has not started');state.personaInstancesById=clone(personaState.personaInstancesById||{});state.runPersonaPool=clone(personaState.runPersonaPool||[]);state.equippedPersonaInstanceIds=clone(personaState.equippedPersonaInstanceIds||[null,null,null,null]);state.dynamicPersonaTemplatesById=clone(personaState.dynamicPersonaTemplatesById||{});state.personaHistory=clone(personaState.personaHistory||{usedHandTypes:[],previousHandType:null,sameHandTypeStreak:0});return getPersonaRuntimeState()}
  function runOnce(effectId,action){if(!state||!state.currentNodeId)throw new Error('No current node');const runtime=runtimeFor(state.currentNodeId);runtime.appliedEffectIds=runtime.appliedEffectIds||[];if(runtime.appliedEffectIds.includes(effectId))return{executed:false,duplicate:true};runtime.appliedEffectIds.push(effectId);try{return{executed:true,value:typeof action==='function'?action():undefined}}catch(error){runtime.appliedEffectIds=runtime.appliedEffectIds.filter(id=>id!==effectId);throw error}}
  function updateRunMetrics(patch){if(!state||!state.runMetrics)return null;state.runMetrics={...state.runMetrics,...clone(patch)};return clone(state.runMetrics)}
  function updateRunResult(patch){if(!state||!state.runResult)return null;state.runResult={...state.runResult,...clone(patch)};return clone(state.runResult)}
  function clear(){state=null}
  const api={RUN_END,TRANSITION_VERSION,startRun,enterNode,completeNode,resolveTransition,transitionTo,finishRun,restoreRun,registerNodeHandler,setFinishHandler,getState:()=>clone(state),getCurrentNode:()=>clone(currentNode()),getCurrentRuntime:()=>state&&state.currentNodeId?clone(runtimeFor(state.currentNodeId)):null,setNodeRuntime,getPersonaRuntimeState,setPersonaRuntimeState,getRunMetrics:()=>clone(state?.runMetrics||null),updateRunMetrics,getRunResult:()=>clone(state?.runResult||null),updateRunResult,runOnce,serializeState:()=>clone(state),clear};
  root.runController=api;
})(globalThis);
