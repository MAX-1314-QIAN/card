(function(root){
  'use strict';

  function utils(){
    if(!root.GameUiFormatters)throw new Error('GameBuildInspection requires GameUiFormatters');
    return root.GameUiFormatters;
  }

  function normalizeGrowthState(growth={}){
    return{
      suitChipBonusBySuit:growth.suitChipBonusBySuit||{},
      suitLevelsBySuit:growth.suitLevelsBySuit||{},
      handTypeLevelsById:growth.handTypeLevelsById||{}
    };
  }

  function handTypeView(type,growth={}){
    const normalized=normalizeGrowthState(growth),level=Number(normalized.handTypeLevelsById[type.id]||0),chipGain=Math.round(type.chips*.1)*level,multGain=Number((type.mult*.1*level).toFixed(4));
    return{level,chips:type.chips+chipGain,mult:type.mult+multGain,chipGain,multGain};
  }

  function handRulesMarkup(handTypes,growth={}){
    const {escapeHtml,formatNumber}=utils(),highestPriority=Math.max(...handTypes.map(item=>item.priority));
    return[...handTypes].sort((a,b)=>(a.displayOrder??a.priority)-(b.displayOrder??b.priority)).map(type=>{
      const current=handTypeView(type,growth),enhanced=current.level>0,aria=`${type.name}，当前等级 ${current.level}，当前基础筹码 ${formatNumber(current.chips)}，当前基础倍率 ${formatNumber(current.mult)}`;
      return`<article class="${type.priority===highestPriority?'top-rule ':''}${enhanced?'enhanced-rule':''}" aria-label="${escapeHtml(aria)}"><b class="rule-rank ${enhanced?'enhanced':''}">Lv.${current.level}</b><span class="rule-icon ${type.iconClass||''}">${type.icon}</span><div><h3>${type.name}${enhanced?'<i>已强化</i>':''}</h3><p>${type.description}</p></div><strong>${formatNumber(current.chips)}${enhanced?`<small>+${formatNumber(current.chipGain)}</small>`:''}</strong><em>×${formatNumber(current.mult)}${enhanced?`<small>+${formatNumber(current.multGain)}</small>`:''}</em></article>`;
    }).join('');
  }

  function suitView(card,growth={}){
    const normalized=normalizeGrowthState(growth);
    return{bonus:Number(normalized.suitChipBonusBySuit[card.s]||0),level:Number(normalized.suitLevelsBySuit[card.s]||0)};
  }

  function suitSummary(growth={}){
    const {formatNumber}=utils(),normalized=normalizeGrowthState(growth),labels=['♠','♥','♦','♣'].map(suit=>({suit,level:Number(normalized.suitLevelsBySuit[suit]||0),bonus:Number(normalized.suitChipBonusBySuit[suit]||0)})).filter(item=>item.level>0);
    return{
      labels,
      markup:labels.length?`花色强化 ${labels.map(item=>`<b class="${['♥','♦'].includes(item.suit)?'red':''}">${item.suit} Lv.${item.level} <i>+${formatNumber(item.bonus)}</i></b>`).join('')}`:'',
      ariaLabel:labels.length?`花色强化：${labels.map(item=>`${item.suit}等级${item.level}，每张计分牌增加${formatNumber(item.bonus)}筹码`).join('；')}`:'当前没有花色强化'
    };
  }

  root.GameBuildInspection=Object.freeze({normalizeGrowthState,handTypeView,handRulesMarkup,suitView,suitSummary});
})(globalThis);
