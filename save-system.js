(() => {
  'use strict';
  const balance=globalThis.BALANCE_V21,manifest=globalThis.PERSONA_BALANCE_MANIFEST;
  if(!balance||!manifest)throw new Error('Run save requires balance manifest');
  const SAVE_KEY='persona-run-save-v2',TEMP_KEY='persona-run-save-temp-v2',LEGACY_KEY='persona-run-save-v1',LEGACY_TEMP_KEY='persona-run-save-temp-v1',VERSION=2;
  const phases=['boss_reveal','battle','settlement','route','event','shop','report','forge','choice','acquire','persona_growth','slice_end','target_loadout','target_report','target_carry'];
  const battleNodes=['DEMO_BATTLE_01','DEMO_BATTLE_02','DEMO_BATTLE_03'],routeNodes=['DEMO_ROUTE_01','DEMO_ROUTE_02'];
  const parse=raw=>{try{return JSON.parse(raw)}catch{return null}};
  const validCard=card=>card&&typeof card==='object'&&typeof card.r==='string'&&typeof card.s==='string'&&Number.isFinite(card.ri);
  function validRunState(runState){
    const template=manifest.runTemplates.find(item=>item.id===runState?.runTemplateId);if(!template||!template.nodeIds.includes(runState.currentNodeId))return false;
    if(!['NOT_ENTERED','ENTERED','IN_PROGRESS','COMPLETED','RUN_COMPLETED'].includes(runState.nodeStatus))return false;
    if(!Array.isArray(runState.completedNodeIds)||runState.completedNodeIds.some(id=>!template.nodeIds.includes(id)))return false;
    const templateBattleCount=template.nodeIds.map(id=>manifest.stageNodes.find(node=>node.id===id)).filter(node=>node?.type==='BATTLE').length;
    if(!Number.isInteger(runState.battleIndexCompat)||runState.battleIndexCompat<0||runState.battleIndexCompat>=templateBattleCount||!Number.isInteger(runState.transitionVersion))return false;
    const equipped=runState.equippedPersonaInstanceIds||[null,null,null,null],instances=runState.personaInstancesById||{},templates=new Set([...(manifest.personaTemplates?.templates||[]).map(item=>item.id),...Object.keys(runState.dynamicPersonaTemplatesById||{})]);
    return equipped.length===4&&new Set(equipped.filter(Boolean)).size===equipped.filter(Boolean).length&&equipped.filter(Boolean).every(id=>instances[id])&&Object.values(instances).every(instance=>templates.has(instance.templateId));
  }
  function validate(save){
    if(!save||save.version!==VERSION||!save.state||!phases.includes(save.phase)||!validRunState(save.state.runState))return false;const state=save.state;
    if(!Number.isInteger(state.battleIndex)||state.battleIndex!==state.runState.battleIndexCompat)return false;
    if(!Array.isArray(state.hand)||state.hand.length>balance.battle.startingHandSize||!state.hand.every(validCard))return false;
    return Array.isArray(state.deck)&&state.deck.every(validCard)&&Array.isArray(state.runDeck)&&state.runDeck.every(validCard);
  }
  function legacyValid(save){const state=save?.state;return save?.version===1&&state&&phases.includes(save.phase)&&Number.isInteger(state.battleIndex)&&state.battleIndex>=0&&state.battleIndex<3&&Array.isArray(state.hand)&&Array.isArray(state.deck)&&Array.isArray(state.runDeck)}
  function completedPath(index,includeBattle){const ids=[];for(let i=0;i<index;i++){ids.push(battleNodes[i]);if(routeNodes[i])ids.push(routeNodes[i])}if(includeBattle)ids.push(battleNodes[index]);return ids}
  function migrateV1(save){
    if(!legacyValid(save))return null;const index=save.state.battleIndex,phase=save.phase;let currentNodeId,completedNodeIds=[];
    if(['boss_reveal','battle','settlement'].includes(phase)){currentNodeId=battleNodes[index];completedNodeIds=completedPath(index,false)}
    else if(['route','event','shop'].includes(phase)){if(index>1)return null;currentNodeId=routeNodes[index];completedNodeIds=completedPath(index,true)}
    else if(phase==='report'){currentNodeId='DEMO_REPORT';completedNodeIds=completedPath(index,true)}
    else if(['forge','choice','acquire'].includes(phase)){currentNodeId='DEMO_FORGE';completedNodeIds=[...completedPath(index,true),'DEMO_REPORT']}
    else return null;
    const nodeRuntimeById={};for(const id of completedNodeIds)nodeRuntimeById[id]={entered:true,completed:true,completionResult:{type:'MIGRATED_V1'},appliedEffectIds:['MIGRATED_V1'],data:{}};
    nodeRuntimeById[currentNodeId]={entered:true,completed:false,completionResult:null,appliedEffectIds:phase==='settlement'?['battle_resolution']:[],data:{}};
    const runState={runTemplateId:manifest.activeRunTemplateId,currentNodeId,nodeStatus:'IN_PROGRESS',completedNodeIds,battleIndexCompat:index,runStartedAt:save.savedAt||Date.now(),runEndedAt:null,transitionVersion:globalThis.runController?.TRANSITION_VERSION||1,nodeRuntimeById};
    return{...save,version:VERSION,migratedFromVersion:1,state:{...save.state,runState}};
  }
  function persist(save){try{const raw=JSON.stringify(save);localStorage.setItem(TEMP_KEY,raw);if(!validate(parse(localStorage.getItem(TEMP_KEY))))return false;localStorage.setItem(SAVE_KEY,raw);localStorage.removeItem(TEMP_KEY);return true}catch{return false}}
  function read(){
    for(const key of [SAVE_KEY,TEMP_KEY]){const save=parse(localStorage.getItem(key));if(validate(save))return save}
    for(const key of [LEGACY_KEY,LEGACY_TEMP_KEY]){const migrated=migrateV1(parse(localStorage.getItem(key)));if(migrated&&validate(migrated)){persist(migrated);return migrated}}
    return null;
  }
  function write(phase,reason='auto'){if(typeof window.buildRunSaveState!=='function')return false;const save={version:VERSION,savedAt:Date.now(),phase,reason,state:window.buildRunSaveState()};if(!validate(save)||!persist(save))return false;window.dispatchEvent?.(new CustomEvent('run-save-changed'));return true}
  function clear(){try{for(const key of [SAVE_KEY,TEMP_KEY,LEGACY_KEY,LEGACY_TEMP_KEY])localStorage.removeItem(key);window.dispatchEvent?.(new CustomEvent('run-save-changed'))}catch{}}
  function restore(){const save=read();return save&&typeof window.restoreRunSaveState==='function'?window.restoreRunSaveState(save):false}
  function summary(){const save=read();if(!save)return null;const labels={boss_reveal:'首领规则揭示',battle:'战斗中',settlement:'战斗结算',route:'路线选择',event:'随机事件',shop:'幕间商店',report:'人格报告',forge:'人格铸造',choice:'人格三选一',acquire:'人格获得',persona_growth:'人格成长测试',slice_end:'垂直切片结束',target_loadout:'目标长局人格选择',target_report:'目标长局报告',target_carry:'目标长局人格带出'};return{...save,label:labels[save.phase]||save.phase,node:save.state.runState.battleIndexCompat+1,currentNodeId:save.state.runState.currentNodeId}}
  window.runSave={read,write,clear,restore,summary,validate,migrateV1,key:SAVE_KEY,legacyKey:LEGACY_KEY};window.commitRunSave=(phase,reason)=>write(phase,reason);window.clearRunSave=clear;
})();
