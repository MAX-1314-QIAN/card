(() => {
  'use strict';
  const balance=globalThis.BALANCE_V21,manifest=globalThis.PERSONA_BALANCE_MANIFEST;
  if(!balance||!manifest)throw new Error('Run save requires balance manifest');
  const SAVE_KEY='persona-run-save-v3',TEMP_KEY='persona-run-save-temp-v3',LEGACY_KEYS=['persona-run-save-v2','persona-run-save-temp-v2','persona-run-save-v1','persona-run-save-temp-v1'],VERSION=3;
  const phases=['stage_intro','boss_reveal','battle','settlement','route','event','shop','report','forge','choice','acquire','persona_growth','slice_end','target_loadout','target_report','target_carry'];
  let invalidatedLegacySave=false;
  const parse=raw=>{try{return JSON.parse(raw)}catch{return null}};
  const validCard=card=>card&&typeof card==='object'&&typeof card.r==='string'&&typeof card.s==='string'&&Number.isFinite(card.ri)&&(!card.shopModifiers||(['bonusCoins','bonusMult','bonusXmultRate'].every(key=>Number.isFinite(Number(card.shopModifiers[key]||0)))));
  function validShopSession(runState){
    const node=manifest.stageNodes.find(item=>item.id===runState?.currentNodeId),session=runState?.nodeRuntimeById?.[runState.currentNodeId]?.data?.shopSession;if(!session)return true;
    const profile=manifest.shop?.refreshProfiles?.find(item=>item.id===session.profileId),items=new Map((manifest.shop?.items||[]).map(item=>[item.id,item]));if(!profile||node?.shopProfileId&&node.shopProfileId!==profile.id||session.version!==2||!Number.isInteger(session.refreshIndex)||session.refreshIndex<0||!Array.isArray(session.offers)||session.offers.length>profile.offerSlotCount||!Array.isArray(session.purchasedItemIds))return false;
    if(new Set(session.purchasedItemIds).size!==session.purchasedItemIds.length||session.purchasedItemIds.some(id=>!items.has(id)))return false;
    const offerIds=new Set(),itemIds=new Set();for(const offer of session.offers){const item=items.get(offer.itemId);if(!item||typeof offer.offerId!=='string'||offerIds.has(offer.offerId)||itemIds.has(offer.itemId)||!Number.isInteger(offer.purchaseCount)||offer.purchaseCount<0||offer.purchaseCount>item.purchaseLimit)return false;offerIds.add(offer.offerId);itemIds.add(offer.itemId)}return session.selectedItemId==null||itemIds.has(session.selectedItemId);
  }
  function validRunState(runState){
    const template=manifest.runTemplates.find(item=>item.id===runState?.runTemplateId);if(!template||!template.nodeIds.includes(runState.currentNodeId))return false;
    if(!['NOT_ENTERED','ENTERED','IN_PROGRESS','COMPLETED','RUN_COMPLETED'].includes(runState.nodeStatus))return false;
    if(!Array.isArray(runState.completedNodeIds)||runState.completedNodeIds.some(id=>!template.nodeIds.includes(id)))return false;
    const templateBattleCount=template.nodeIds.map(id=>manifest.stageNodes.find(node=>node.id===id)).filter(node=>node?.type==='BATTLE').length;
    if(!Number.isInteger(runState.battleIndexCompat)||runState.battleIndexCompat<0||runState.battleIndexCompat>=templateBattleCount||!Number.isInteger(runState.transitionVersion))return false;
    const equipped=runState.equippedPersonaInstanceIds||[null,null,null,null],instances=runState.personaInstancesById||{},templates=new Set([...(manifest.personaTemplates?.templates||[]).map(item=>item.id),...Object.keys(runState.dynamicPersonaTemplatesById||{})]);
    const growth=runState.shopGrowthState||{},validGrowthMap=map=>map&&typeof map==='object'&&!Array.isArray(map)&&Object.values(map).every(value=>Number.isFinite(value)&&value>=0),developerOptions=runState.developerOptions||{},directions=runState.aiPersonaDirectionByNode||{},validDirections=directions&&typeof directions==='object'&&!Array.isArray(directions)&&Object.entries(directions).every(([nodeId,directionId])=>['N04','N08','N12'].includes(nodeId)&&['AI_DIRECTION_BRIDGE','AI_DIRECTION_BREAK','AI_DIRECTION_FOLLOW'].includes(directionId));
    return equipped.length===4&&new Set(equipped.filter(Boolean)).size===equipped.filter(Boolean).length&&equipped.filter(Boolean).every(id=>instances[id])&&Object.values(instances).every(instance=>templates.has(instance.templateId))&&validGrowthMap(growth.suitChipBonusBySuit||{})&&validGrowthMap(growth.suitLevelsBySuit||{})&&validGrowthMap(growth.handTypeLevelsById||{})&&(developerOptions.offlineAiPersonaEnabled===undefined||typeof developerOptions.offlineAiPersonaEnabled==='boolean')&&(runState.personaGenerationMode===undefined||['LOCAL_V1','LEGACY_PROTOTYPE','DISABLED'].includes(runState.personaGenerationMode))&&validDirections&&validShopSession(runState);
  }
  function validate(save){
    if(!save||save.version!==VERSION||!save.state||!phases.includes(save.phase)||!validRunState(save.state.runState))return false;const state=save.state;
    if(!Number.isInteger(state.battleIndex)||state.battleIndex!==state.runState.battleIndexCompat||!Number.isFinite(state.coins)||state.coins<0)return false;
    if(!Array.isArray(state.hand)||state.hand.length>balance.battle.startingHandSize||!state.hand.every(validCard))return false;
    return Array.isArray(state.deck)&&state.deck.every(validCard)&&Array.isArray(state.runDeck)&&state.runDeck.every(validCard);
  }
  function persist(save){try{const raw=JSON.stringify(save);localStorage.setItem(TEMP_KEY,raw);if(!validate(parse(localStorage.getItem(TEMP_KEY))))return false;localStorage.setItem(SAVE_KEY,raw);localStorage.removeItem(TEMP_KEY);return true}catch{return false}}
  function read(){
    for(const key of [SAVE_KEY,TEMP_KEY]){const save=parse(localStorage.getItem(key));if(validate(save))return save}
    for(const key of [SAVE_KEY,TEMP_KEY,...LEGACY_KEYS]){if(localStorage.getItem(key)!==null){localStorage.removeItem(key);invalidatedLegacySave=true}}
    return null;
  }
  function write(phase,reason='auto'){if(typeof window.buildRunSaveState!=='function')return false;const save={version:VERSION,savedAt:Date.now(),phase,reason,state:window.buildRunSaveState()};if(!validate(save)||!persist(save))return false;window.dispatchEvent?.(new CustomEvent('run-save-changed'));return true}
  function clear(){try{for(const key of [SAVE_KEY,TEMP_KEY,...LEGACY_KEYS])localStorage.removeItem(key);invalidatedLegacySave=false;window.dispatchEvent?.(new CustomEvent('run-save-changed'))}catch{}}
  function restore(){const save=read();return save&&typeof window.restoreRunSaveState==='function'?window.restoreRunSaveState(save):false}
  function summary(){const save=read();if(!save)return null;const labels={stage_intro:'关卡揭示',boss_reveal:'关卡揭示',battle:'战斗中',settlement:'战斗结算',route:'路线选择',event:'随机事件',shop:'幕间商店',report:'人格报告',forge:'人格铸造',choice:'人格三选一',acquire:'人格获得',persona_growth:'人格成长测试',slice_end:'垂直切片结束',target_loadout:'目标长局人格选择',target_report:'目标长局报告',target_carry:'目标长局人格带出'};return{...save,label:labels[save.phase]||save.phase,node:save.state.runState.battleIndexCompat+1,currentNodeId:save.state.runState.currentNodeId}}
  function hadInvalidatedLegacySave(){read();return invalidatedLegacySave}
  window.runSave={read,write,clear,restore,summary,validate,hadInvalidatedLegacySave,key:SAVE_KEY};window.commitRunSave=(phase,reason)=>write(phase,reason);window.clearRunSave=clear;
})();
