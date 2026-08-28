(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  function resolvedValue(effect,runtimeState){return Number.isFinite(effect.value)?effect.value:(runtimeState?.[effect.runtimeCounter]||0)*(effect.valuePerStack||0)}
  function execute(effects,{runtimeState,caps={},commit=false,source='Persona'}={}){
    const next=clone(runtimeState||{}),result={chipsDelta:0,multDelta:0,xmultRateDelta:0,coinsDelta:0,handLimitDelta:0,discardLimitDelta:0,finalMultiplier:1,runtimeState:next,events:[]};
    for(const effect of effects||[]){const value=resolvedValue(effect,next),event={...clone(effect),source,type:effect.type,value,phase:effect.phase||null};
      if(effect.type==='ADD_CHIPS')result.chipsDelta+=value;
      else if(effect.type==='ADD_MULT')result.multDelta+=value;
      else if(effect.type==='ADD_XMULT_RATE')result.xmultRateDelta+=value;
      else if(effect.type==='ADD_COINS')result.coinsDelta+=value;
      else if(effect.type==='ADD_HAND_LIMIT')result.handLimitDelta+=value;
      else if(effect.type==='ADD_DISCARD_LIMIT')result.discardLimitDelta+=value;
      else if(effect.type==='MULTIPLY_FINAL')result.finalMultiplier*=value;
      else if(commit&&effect.type==='SET_RUNTIME_FLAG')next[effect.key]=effect.value??true;
      else if(commit&&effect.type==='CLEAR_RUNTIME_FLAG')next[effect.key]=false;
      else if(commit&&['ADD_RUNTIME_COUNTER','ADD_GROWTH_STACK'].includes(effect.type)){const key=effect.runtimeCounter;next[key]=Math.min(caps[key]??Number.POSITIVE_INFINITY,(next[key]||0)+value)}
      result.events.push(event);
    }
    return result;
  }
  root.PersonaEffectExecutor={execute,resolvedValue};
})(globalThis);
