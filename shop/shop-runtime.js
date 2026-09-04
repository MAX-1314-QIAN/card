(function(root,factory){
  const api=factory();
  root.ShopRuntime=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RANK_INDEX={2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,J:11,Q:12,K:13,A:14};
  const SUIT_META={
    '♠':{index:0,color:'black'},
    '♥':{index:1,color:'red'},
    '♦':{index:2,color:'red'},
    '♣':{index:3,color:'black'}
  };
  const UPGRADE_FIELD_BY_STAT={
    BONUS_COINS:'bonusCoins',
    BONUS_MULT:'bonusMult',
    BONUS_XMULT_RATE:'bonusXmultRate'
  };
  const UPGRADE_LABEL_BY_STAT={
    BONUS_CHIPS:'筹码',
    BONUS_COINS:'金币',
    BONUS_MULT:'基础倍率',
    BONUS_XMULT_RATE:'独立倍率'
  };

  function requireCondition(condition,message){if(!condition)throw new Error(message)}
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value))}
  function randomValue(random){const value=random();requireCondition(Number.isFinite(value)&&value>=0&&value<1,'Shop random must return a number in [0, 1)');return value}
  function weightedPick(entries,random=Math.random){
    requireCondition(Array.isArray(entries)&&entries.length>0,'Cannot pick from an empty weighted list');
    const weights=entries.map(entry=>Number(entry.weight));
    requireCondition(weights.every(weight=>Number.isFinite(weight)&&weight>0),'Every shop weight must be greater than zero');
    const total=weights.reduce((sum,weight)=>sum+weight,0),target=randomValue(random)*total;
    let cursor=0;
    for(let index=0;index<entries.length;index++){cursor+=weights[index];if(target<cursor)return entries[index]}
    return entries[entries.length-1];
  }

  function itemMap(config){return new Map((config?.items||[]).map(item=>[item.id,item]))}
  function eligibleSet(value){if(value==null)return null;if(value instanceof Set)return new Set(value);requireCondition(Array.isArray(value),'eligibleItemIds must be an array, Set, or null');return new Set(value)}
  function generateOffers({config,profileId,random=Math.random,eligibleItemIds=null,refreshIndex=0}={}){
    requireCondition(config&&typeof config==='object','Shop config is required');
    requireCondition(typeof random==='function','Shop random must be a function');
    const profile=(config.refreshProfiles||[]).find(entry=>entry.id===profileId);
    requireCondition(profile,`Unknown shop profile: ${profileId}`);
    const items=itemMap(config),allowed=eligibleSet(eligibleItemIds),selected=new Set(),offers=[],typeCounts=new Map();
    const poolEntries=(config.poolEntries||[]).filter(entry=>items.has(entry.itemId));
    const availableForType=itemType=>poolEntries.filter(entry=>entry.poolType===itemType&&!selected.has(entry.itemId)&&(!allowed||allowed.has(entry.itemId)));
    const slotCount=Number(profile.offerSlotCount);
    requireCondition(Number.isInteger(slotCount)&&slotCount>0,`Invalid offerSlotCount for ${profileId}`);
    while(offers.length<slotCount){
      const typeRules=(profile.typeRules||[]).filter(rule=>{
        const drawCount=Number(rule.drawCount),maxPerRefresh=Number(rule.maxPerRefresh);
        return Number.isInteger(drawCount)&&drawCount>0&&Number.isInteger(maxPerRefresh)&&maxPerRefresh>0&&(typeCounts.get(rule.itemType)||0)<maxPerRefresh&&availableForType(rule.itemType).length>0;
      });
      if(!typeRules.length)break;
      const typeRule=weightedPick(typeRules,random),remaining=slotCount-offers.length,typeRemaining=typeRule.maxPerRefresh-(typeCounts.get(typeRule.itemType)||0),count=Math.min(typeRule.drawCount,remaining,typeRemaining);
      let added=0;
      for(let index=0;index<count;index++){
        const available=availableForType(typeRule.itemType);
        if(!available.length)break;
        const poolEntry=weightedPick(available,random),item=items.get(poolEntry.itemId);
        selected.add(item.id);added++;
        typeCounts.set(typeRule.itemType,(typeCounts.get(typeRule.itemType)||0)+1);
        offers.push({
          offerId:`${profile.id}:${refreshIndex}:${String(offers.length+1).padStart(2,'0')}`,
          itemId:item.id,
          itemType:item.itemType,
          refreshRuleId:typeRule.id,
          poolEntryId:poolEntry.id,
          purchaseCount:0
        });
      }
      if(!added)break;
    }
    return{version:2,profileId:profile.id,refreshIndex,offers,purchasedItemIds:[]};
  }

  function refreshCost(refreshIndex){const count=Number(refreshIndex);return Number.isInteger(count)&&count>0?count:0}

  function createCardFromItem(item,options={}){
    const effect=item?.effect;
    requireCondition(effect?.type==='ADD_CARD','createCardFromItem requires an ADD_CARD shop item');
    const card=effect.card||{},rank=String(card.rank),suit=card.suitSymbol,meta=SUIT_META[suit];
    requireCondition(Number.isInteger(RANK_INDEX[rank]),`Unsupported card rank: ${rank}`);
    requireCondition(meta,`Unsupported card suit: ${suit}`);
    const instanceKey=String(options.instanceKey||item.id);
    return{
      r:rank,
      ri:RANK_INDEX[rank],
      s:suit,
      c:meta.color,
      si:meta.index,
      templateId:options.templateId||`shop-template-${instanceKey}`,
      uid:options.uid||`shop-${instanceKey}`,
      bonus:0,
      shopModifiers:{bonusCoins:0,bonusMult:0,bonusXmultRate:0},
      sourceShopItemId:item.id,
      sourceCardConfigId:effect.cardConfigId
    };
  }

  function normalizeUpgradeEffect(effectOrItem){return effectOrItem?.effect||effectOrItem}
  function applyCardUpgrade(card,effectOrItem){
    requireCondition(card&&typeof card==='object','A target card is required');
    const effect=normalizeUpgradeEffect(effectOrItem);
    requireCondition(effect?.type==='UPGRADE_CARD','applyCardUpgrade requires an UPGRADE_CARD effect');
    requireCondition(Object.prototype.hasOwnProperty.call(UPGRADE_LABEL_BY_STAT,effect.targetStat),`Unsupported card upgrade stat: ${effect.targetStat}`);
    const amount=Number(effect.amount);
    requireCondition(Number.isFinite(amount),'Card upgrade amount must be finite');
    const result={...clone(card),shopModifiers:{bonusCoins:0,bonusMult:0,bonusXmultRate:0,...clone(card.shopModifiers||{})}};
    if(effect.targetStat==='BONUS_CHIPS')result.bonus=Number(result.bonus||0)+amount;
    else{
      const field=UPGRADE_FIELD_BY_STAT[effect.targetStat];
      result.shopModifiers[field]=Number(result.shopModifiers[field]||0)+amount;
    }
    return result;
  }

  function cardUpgradeAttributes(card){
    const modifiers=card?.shopModifiers||{};
    return{
      bonusChips:Number(card?.bonus||0),
      bonusCoins:Number(modifiers.bonusCoins||0),
      bonusMult:Number(modifiers.bonusMult||0),
      bonusXmultRate:Number(modifiers.bonusXmultRate||0),
      bonusXmultFactor:1+Number(modifiers.bonusXmultRate||0)
    };
  }

  function formatAmount(stat,amount){return stat==='BONUS_XMULT_RATE'?`${Number((amount*100).toFixed(6))}%`:String(Number(amount))}
  function describeEffect(itemOrEffect){
    const item=itemOrEffect?.effect?itemOrEffect:null,effect=normalizeUpgradeEffect(itemOrEffect);
    if(effect?.type==='ADD_CARD'){const suit=effect.card?.suitId==='DIAMOND'?'方片':effect.card?.suitName||'';return`一张${suit}${effect.card?.rank||''}扑克牌。`}
    if(effect?.type==='ADD_PERSONA'){const name=item?.name;if(!name)return'获得一张新人格。';return/^人格牌\d+$/.test(name)?`获得${name}。`:`获得一张“${name}”人格牌。`}
    if(effect?.type==='UPGRADE_CARD')return`选择1张牌，${UPGRADE_LABEL_BY_STAT[effect.targetStat]||effect.targetStat}+${formatAmount(effect.targetStat,Number(effect.amount))}。`;
    if(effect?.type==='REMOVE_CARD')return`移除${effect.quantity||1}张牌。`;
    if(effect?.type==='UPGRADE_PERSONA_MAIN')return'选择1张人格牌，按主词条类型强化：筹码+10、倍率+0.3或独立倍率+10%。';
    if(effect?.type==='UPGRADE_SUIT')return`选择1种花色，该花色所有计分牌每张筹码+${effect.chipsPerScoringCard}；后续获得的同花色牌同样生效。`;
    if(effect?.type==='UPGRADE_HAND_TYPE')return`选择1种牌型，其原始基础筹码和基础倍率各提升${Number((effect.baseChipRate*100).toFixed(4))}%。`;
    if(['REFRESH_SHOP','ADD_SHOP_REFRESH'].includes(effect?.type))return'获得一次刷新机会。';
    return'获得对应商品效果。';
  }

  function removeCardByUid(cards,uid){
    requireCondition(Array.isArray(cards),'Card collection must be an array');
    const index=cards.findIndex(card=>card.uid===uid);
    if(index<0)return{removed:null,cards:clone(cards)};
    return{removed:clone(cards[index]),cards:cards.filter((_,cardIndex)=>cardIndex!==index).map(clone)};
  }

  function normalizeGrowthState(value={}){return{
    suitChipBonusBySuit:{...(value.suitChipBonusBySuit||{})},
    suitLevelsBySuit:{...(value.suitLevelsBySuit||{})},
    handTypeLevelsById:{...(value.handTypeLevelsById||{})}
  }}
  function applySuitUpgrade(state,suitSymbol,effectOrItem){
    const effect=normalizeUpgradeEffect(effectOrItem),next=normalizeGrowthState(state),amount=Number(effect?.chipsPerScoringCard);
    requireCondition(effect?.type==='UPGRADE_SUIT'&&['♠','♥','♦','♣'].includes(suitSymbol)&&Number.isFinite(amount)&&amount>0,'applySuitUpgrade requires a valid suit target');
    next.suitChipBonusBySuit[suitSymbol]=Number(next.suitChipBonusBySuit[suitSymbol]||0)+amount;next.suitLevelsBySuit[suitSymbol]=Number(next.suitLevelsBySuit[suitSymbol]||0)+1;return next;
  }
  function applyHandTypeUpgrade(state,handTypeId,effectOrItem){
    const effect=normalizeUpgradeEffect(effectOrItem),next=normalizeGrowthState(state);
    requireCondition(effect?.type==='UPGRADE_HAND_TYPE'&&typeof handTypeId==='string'&&handTypeId&&effect.baseChipRate>0&&effect.baseMultRate>0,'applyHandTypeUpgrade requires a valid hand type target');
    next.handTypeLevelsById[handTypeId]=Number(next.handTypeLevelsById[handTypeId]||0)+1;return next;
  }
  function targetUpgradePrice(item,level=0){const increment=item?.priceGrowth?.type==='PER_TARGET_LEVEL'?Number(item.priceGrowth.increment||0):0;return Number(item?.price||0)+Math.max(0,Number(level)||0)*increment}

  function purchaseAvailability({item,coins,purchaseCount=0}={}){
    if(!item)return{allowed:false,reason:'UNKNOWN_ITEM'};
    if(!Number.isFinite(coins)||coins<item.price)return{allowed:false,reason:'INSUFFICIENT_COINS'};
    if(purchaseCount>=item.purchaseLimit)return{allowed:false,reason:'PURCHASE_LIMIT_REACHED'};
    return{allowed:true,reason:'AVAILABLE'};
  }

  return{
    weightedPick,
    generateOffers,
    refreshCost,
    createCardFromItem,
    applyCardUpgrade,
    cardUpgradeAttributes,
    describeEffect,
    removeCardByUid,
    normalizeGrowthState,
    applySuitUpgrade,
    applyHandTypeUpgrade,
    targetUpgradePrice,
    purchaseAvailability
  };
});
