(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  function createPersonaInstance(template,meta={}){
    if(!template?.id)throw new Error('Persona template is required');
    return{instanceId:meta.instanceId||`persona-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,templateId:template.id,source:meta.source||'UNKNOWN',qualityId:template.qualityId,generatedAtNodeId:meta.generatedAtNodeId??null,generatedAtBattleIndexCompat:meta.generatedAtBattleIndexCompat??null,behaviorFamilyId:template.behaviorFamilyId??null,runtimeState:clone(template.runtimeDefaults||{}),subAffixSlots:clone(meta.subAffixSlots||[]),createdAt:meta.createdAt||Date.now(),version:1};
  }
  function validatePersonaInstance(instance,template){
    if(!instance||!template||instance.templateId!==template.id||typeof instance.instanceId!=='string'||!instance.instanceId)return false;
    if(instance.qualityId!==template.qualityId||instance.version!==1||!instance.runtimeState||typeof instance.runtimeState!=='object'||Array.isArray(instance.runtimeState))return false;
    const allowed=new Set(Object.keys(template.runtimeDefaults||{}));if(!Object.keys(instance.runtimeState).every(key=>allowed.has(key)))return false;return !instance.subAffixSlots||Array.isArray(instance.subAffixSlots);
  }
  root.PersonaInstance={createPersonaInstance,validatePersonaInstance};
})(globalThis);
