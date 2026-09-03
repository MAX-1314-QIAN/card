(function(root){
  'use strict';

  const effectAliases=Object.freeze({chips:'ADD_CHIPS',mult:'ADD_MULT',xmult:'MULTIPLY_FINAL'});

  function formatters(){
    if(!root.GameUiFormatters)throw new Error('GamePersonaPresentation requires GameUiFormatters');
    return root.GameUiFormatters;
  }

  function normalizeEffectType(effectType){
    return effectAliases[effectType]||effectType;
  }

  function triggerTextFromConfig(persona){
    return{
      HAND_HAS_STRAIGHT:'形成顺子或同花顺时',
      MIN_UNIQUE_SUITS:`一手牌包含至少 ${persona.triggerValue} 种花色时`,
      EXACT_SUBMITTED_CARDS:`恰好提交 ${persona.triggerValue} 张牌时`,
      HAS_MATCHED_RANK_STRUCTURE:'形成对子或更高同点结构时',
      HAND_HAS_FLUSH:'形成同花或同花顺时',
      NEXT_PLAY_AFTER_MIN_DISCARD:`一次弃掉至少 ${persona.triggerValue} 张牌后的下一手`
    }[persona.triggerType]||'条件成立时';
  }

  function valueText(persona){
    const effectType=normalizeEffectType(persona.effectType);
    return effectType==='ADD_CHIPS'?`+${persona.value} 筹码`:effectType==='ADD_MULT'?`+${persona.value} 倍率`:`最终倍率 ×${persona.value}`;
  }

  function hydrateBasePersona(config){
    const normalized={...config,effectType:normalizeEffectType(config.effectType)},effect=valueText(normalized);
    return{...normalized,baseId:config.id,effect,desc:`${triggerTextFromConfig(normalized)}，${effect}。`};
  }

  function libraryEffectMarkup(persona){
    const {escapeHtml}=formatters();
    if(persona.mainEffect)return`<span class="persona-main-entry">主词条 · ${escapeHtml(persona.mainEntry)}</span><span>${escapeHtml(persona.mainEffect.triggerText)}，<strong class="persona-value">${escapeHtml(persona.mainEffect.effectText)}</strong></span>`;
    const amount=escapeHtml(valueText(persona).replace(/\s+/g,'')),value=escapeHtml(persona.triggerValue);
    const trigger={
      HAND_HAS_STRAIGHT:'出<strong class="persona-keyword">顺子或同花顺</strong>',
      MIN_UNIQUE_SUITS:`一手含至少<strong class="persona-keyword">${value}种花色</strong>`,
      EXACT_SUBMITTED_CARDS:`恰好出<strong class="persona-keyword">${value}张牌</strong>`,
      HAS_MATCHED_RANK_STRUCTURE:'出<strong class="persona-keyword">对子或更高同点牌型</strong>',
      HAND_HAS_FLUSH:'出<strong class="persona-keyword">同花或同花顺</strong>',
      NEXT_PLAY_AFTER_MIN_DISCARD:`先弃至少<strong class="persona-keyword">${value}张牌</strong>，下一手`
    }[persona.triggerType]||'满足<strong class="persona-keyword">触发条件</strong>';
    return`${trigger}，结算 <strong class="persona-value">${amount}</strong>`;
  }

  function battleEffectMarkup(persona,{legacyPersona=null,feedbackCardView=null,effectText=null}={}){
    const {escapeHtml}=formatters();
    if(persona.template?.mainEffect)return`${escapeHtml(persona.template.mainEffect.triggerText)}，<strong class="persona-value">${escapeHtml(persona.template.mainEffect.effectText)}</strong>`;
    if(legacyPersona||persona.triggerType)return libraryEffectMarkup(legacyPersona||persona).replace(/<span class="persona-main-entry">.*?<\/span>/,'');
    const feedback=persona.feedback||(typeof feedbackCardView==='function'?feedbackCardView(persona.template,{}):{trigger:'条件成立时',reward:'人格效果生效'}),trigger=escapeHtml(feedback.trigger).replace(/(顺子或同花顺|同花或同花顺|对子或更高的同点数结构|至少\s*\d+\s*种花色|恰好打出\s*\d+\s*张牌|一次弃掉至少\s*\d+\s*张牌|本局尚未记录的新牌型|已完成蓄力)/g,'<strong class="persona-keyword">$1</strong>'),effects=[...(persona.template?.effects||[]),...(persona.template?.growthRules||[]).flatMap(rule=>rule.effects||[])].filter(effect=>['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL','ADD_GROWTH_STACK'].includes(effect.type)).map(effect=>typeof effectText==='function'?effectText(effect).replace(/加法倍率/g,'倍率').replace(/\s+/g,''):'').filter(Boolean).join('，'),result=escapeHtml(effects||feedback.reward).replace(/(最终倍率×\d+(?:\.\d+)?|每层\+\d+(?:\.\d+)?倍率|\+\d+(?:\.\d+)?(?:筹码|倍率|层))/g,'<strong class="persona-value">$1</strong>');
    return`${trigger}，结算 ${result}`;
  }

  function compactFeedbackRows(entries=[]){
    const groups=new Map();
    for(const entry of entries){
      const group=groups.get(entry.name)||{name:entry.name,count:0,effects:[]};
      group.count++;
      group.effects.push(...entry.effects);
      groups.set(entry.name,group);
    }
    return[...groups.values()].map(group=>{
      const sums=new Map(),labels=[];
      for(const effect of group.effects){
        const match=effect.match(/^([+-]?\d+(?:\.\d+)?)\s*(筹码|加法倍率)$/);
        if(match)sums.set(match[2],(sums.get(match[2])||0)+Number(match[1]));
        else if(!labels.includes(effect))labels.push(effect);
      }
      for(const [unit,value] of sums)labels.unshift(`${value>=0?'+':''}${Number(value.toFixed(2))}${unit==='加法倍率'?'倍率':unit}`);
      return{...group,effect:labels.join(' · ')};
    });
  }

  function shopCardView(template,instance,{feedbackCardView=null}={}){
    const feedback=typeof feedbackCardView==='function'?feedbackCardView(template,instance?.runtimeState||{}):{trigger:'满足人格触发条件时',reward:'人格效果生效'},hasAffixes=!!template.subAffixRules,entryLabel=template.mainEntry?`主词条 · ${template.mainEntry}`:template.mode?`人格类型 · ${template.mode}`:'成长人格',triggerText=template.mainEffect?.triggerText||(template.triggerType?triggerTextFromConfig(template):feedback.trigger)||'满足人格触发条件时',effectTextValue=template.mainEffect?.effectText||(template.effectType?valueText(template):feedback.reward)||'人格效果生效';
    return{feedback,hasAffixes,entryLabel,triggerText,effectText:effectTextValue};
  }

  function shopEffectText(presentation){
    const trigger=String(presentation.triggerText||'').replace(/数量达到\s*4\s*张以上/g,'≥ 4张').replace(/\s+/g,' ').trim(),effect=String(presentation.effectText||'').replace(/\s+/g,'').trim();
    return`${trigger}，${effect}。`;
  }

  root.GamePersonaPresentation=Object.freeze({normalizeEffectType,triggerTextFromConfig,valueText,hydrateBasePersona,libraryEffectMarkup,battleEffectMarkup,compactFeedbackRows,shopCardView,shopEffectText});
})(globalThis);
