(function(root){
  'use strict';
  const STORAGE_KEY='persona-permanent-collection-v1';
  const VERSION=1;
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const safeId=value=>String(value||'persona').replace(/[^a-zA-Z0-9_-]/g,'_');

  function initialRecord(template){
    return{collectionId:`INITIAL_${template.id}`,cardId:template.id,templateId:template.id,source:'INITIAL_COLLECTION',templateSnapshot:null,acquiredAt:null,originalInstanceId:null,version:1};
  }
  function validRecord(record){
    return !!record&&record.version===1&&typeof record.collectionId==='string'&&!!record.collectionId&&typeof record.cardId==='string'&&!!record.cardId&&typeof record.templateId==='string'&&!!record.templateId&&record.source==='CARRY_OUT'&&record.templateSnapshot?.id===record.templateId&&!('subAffixSlots' in record)&&!('runtimeState' in record);
  }
  function create({storage=root.localStorage,initialTemplates=[],now=()=>Date.now()}={}){
    const initial=(initialTemplates||[]).filter(template=>template?.id).map(initialRecord);
    let cached=null;
    function empty(){return{version:VERSION,records:[]}}
    function read(){
      if(cached)return clone(cached);
      try{const parsed=JSON.parse(storage?.getItem?.(STORAGE_KEY)||'null');cached=parsed?.version===VERSION&&Array.isArray(parsed.records)&&parsed.records.every(validRecord)?parsed:empty()}catch{cached=empty()}
      return clone(cached);
    }
    function persist(state){
      cached=clone(state);
      try{storage?.setItem?.(STORAGE_KEY,JSON.stringify(cached));return{ok:true}}catch(error){return{ok:false,error}}
    }
    function list(){return clone([...initial,...read().records])}
    function get(cardId){return list().find(record=>record.cardId===cardId)||null}
    function carryOut({instance,template,runTemplateId=null,nodeId=null}={}){
      if(!instance?.instanceId||!template?.id||instance.templateId!==template.id)return{ok:false,reason:'INVALID_PERSONA'};
      const state=read(),existing=state.records.find(record=>record.originalInstanceId===instance.instanceId);
      if(existing)return{ok:true,duplicate:true,record:clone(existing)};
      const collectionId=`CARRY_${safeId(instance.instanceId)}`,record={collectionId,cardId:collectionId,templateId:template.id,source:'CARRY_OUT',templateSnapshot:clone(template),acquiredAt:now(),originalInstanceId:instance.instanceId,acquiredRunTemplateId:runTemplateId,acquiredAtNodeId:nodeId,version:1};
      const result=persist({...state,records:[...state.records,record]});
      return result.ok?{ok:true,duplicate:false,record:clone(record)}:{ok:false,reason:'STORAGE_FAILED',error:result.error};
    }
    return{list,get,carryOut,storageKey:STORAGE_KEY,version:VERSION};
  }
  root.PersonaCollection={create,STORAGE_KEY,VERSION};
})(globalThis);
