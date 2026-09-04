(function(root){
  'use strict';
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const prices=modules.targetEconomy.shopPrices;
  const pad=value=>String(value).padStart(3,'0');
  const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const suits=[
    {id:'SPADE',name:'黑桃',symbol:'♠'},
    {id:'HEART',name:'红桃',symbol:'♥'},
    {id:'CLUB',name:'梅花',symbol:'♣'},
    {id:'DIAMOND',name:'方块',symbol:'♦'}
  ];
  const cardItems=suits.flatMap((suit,suitIndex)=>ranks.map((rank,rankIndex)=>{
    const sequence=suitIndex*ranks.length+rankIndex+1,id=`SHOP_CARD_${pad(sequence)}`,cardConfigId=`CARD_${pad(sequence)}`;
    return{
      id,
      name:`${suit.name}${rank}`,
      itemType:'CARD',
      price:prices.card,
      purchaseLimit:1,
      purchaseLimitScope:'SHOP_VISIT',
      effect:{type:'ADD_CARD',quantity:1,cardConfigId,card:{suitId:suit.id,suitName:suit.name,suitSymbol:suit.symbol,rank}},
      sourceEffect:{type:'增加卡牌',parameter1:1,parameter2:null},
      decisionStatus:'CONFIRMED',
      fieldDecisionStatus:{purchaseLimitScope:'CONFIRMED'}
    };
  }));
  const personaItems=(modules.basePersonas?.templates||[]).map((template,index)=>{
    const configuredNumber=String(template.personaId||'').match(/\d+$/)?.[0],sequence=pad(configuredNumber||index+1);
    return{
      id:`SHOP_PER_${sequence}`,
      name:template.displayId||template.name,
      itemType:'PERSONA',
      price:prices.persona,
      purchaseLimit:1,
      purchaseLimitScope:'SHOP_VISIT',
      effect:{type:'ADD_PERSONA',quantity:1,personaTemplateId:template.id},
      sourceEffect:{type:'增加人格牌',parameter1:1,parameter2:null},
      decisionStatus:'CONFIRMED',
      fieldDecisionStatus:{purchaseLimitScope:'CONFIRMED'}
    };
  });
  const serviceItems=[
    {
      id:'SHOP_SERVICE_001',name:'筹码强化',itemType:'SERVICE',price:prices.cardChips,purchaseLimit:1,purchaseLimitScope:'SHOP_VISIT',
      effect:{type:'UPGRADE_CARD',targetStat:'BONUS_CHIPS',amount:5,requiresTarget:true},
      sourceEffect:{type:'强化卡牌',parameter1:'基础筹码',parameter2:5}
    },
    {
      id:'SHOP_SERVICE_002',name:'金币强化',itemType:'SERVICE',price:prices.cardCoins,purchaseLimit:1,purchaseLimitScope:'SHOP_VISIT',
      effect:{type:'UPGRADE_CARD',targetStat:'BONUS_COINS',amount:2,requiresTarget:true},
      sourceEffect:{type:'强化卡牌',parameter1:'金币',parameter2:2}
    },
    {
      id:'SHOP_SERVICE_003',name:'倍率强化',itemType:'SERVICE',price:prices.cardMultiplier,purchaseLimit:1,purchaseLimitScope:'SHOP_VISIT',
      effect:{type:'UPGRADE_CARD',targetStat:'BONUS_MULT',amount:.5,requiresTarget:true},
      sourceEffect:{type:'强化卡牌',parameter1:'基础倍率',parameter2:.5}
    },
    {
      id:'SHOP_SERVICE_004',name:'独立乘区强化',itemType:'SERVICE',price:prices.cardIndependentMultiplier,purchaseLimit:1,purchaseLimitScope:'SHOP_VISIT',
      effect:{type:'UPGRADE_CARD',targetStat:'BONUS_XMULT_RATE',amount:.03,requiresTarget:true},
      sourceEffect:{type:'强化卡牌',parameter1:'独立倍率',parameter2:.03,parameter2Display:'3%'}
    },
    {
      id:'SHOP_SERVICE_005',name:'卡牌移除',itemType:'SERVICE',price:prices.removeCard,purchaseLimit:1,purchaseLimitScope:'SHOP_VISIT',
      effect:{type:'REMOVE_CARD',quantity:1,requiresTarget:true},
      sourceEffect:{type:'移除卡牌',parameter1:1,parameter2:null}
    },
    {
      id:'SHOP_SERVICE_006',name:'人格主词条强化',itemType:'SERVICE',price:prices.buildUpgradeBase,purchaseLimit:1,purchaseLimitScope:'SHOP_VISIT',
      priceGrowth:{type:'PER_TARGET_LEVEL',increment:prices.buildUpgradePerTargetLevel},
      effect:{type:'UPGRADE_PERSONA_MAIN',requiresTarget:true,targetKind:'PERSONA',amountByAttributeType:{BASE_CHIPS:10,BASE_MULT:.3,XMULT_RATE:.1}},
      sourceEffect:{type:'强化人格主词条',parameter1:'按主词条类别',parameter2:'筹码+10 / 倍率+0.3 / 独立倍率+10%'}
    },
    {
      id:'SHOP_SERVICE_007',name:'花色强化',itemType:'SERVICE',price:prices.buildUpgradeBase,purchaseLimit:1,purchaseLimitScope:'SHOP_VISIT',
      priceGrowth:{type:'PER_TARGET_LEVEL',increment:prices.buildUpgradePerTargetLevel},
      effect:{type:'UPGRADE_SUIT',requiresTarget:true,targetKind:'SUIT',chipsPerScoringCard:5},
      sourceEffect:{type:'强化花色',parameter1:'全套',parameter2:'每张计分牌+5筹码'}
    },
    {
      id:'SHOP_SERVICE_008',name:'牌型强化',itemType:'SERVICE',price:prices.buildUpgradeBase,purchaseLimit:1,purchaseLimitScope:'SHOP_VISIT',
      priceGrowth:{type:'PER_TARGET_LEVEL',increment:prices.buildUpgradePerTargetLevel},
      effect:{type:'UPGRADE_HAND_TYPE',requiresTarget:true,targetKind:'HAND_TYPE',baseChipRate:.1,baseMultRate:.1},
      sourceEffect:{type:'强化牌型',parameter1:'全套',parameter2:'原始基础筹码与倍率各+10%'}
    }
  ].map(item=>({...item,decisionStatus:'CONFIRMED',fieldDecisionStatus:{purchaseLimitScope:'CONFIRMED'}}));
  const refreshProfiles=[
    {
      id:'AI1',stageNodeId:'N04',offerSlotCount:4,decisionStatus:'PROTOTYPE_ASSUMPTION',fieldDecisionStatus:{offerSlotCount:'CONFIRMED',typeWeights:'PROTOTYPE_ASSUMPTION'},
      typeRules:[
        {id:'REFRESH_001',itemType:'CARD',drawCount:1,maxPerRefresh:4,weight:40},
        {id:'REFRESH_002',itemType:'PERSONA',drawCount:1,maxPerRefresh:1,weight:8},
        {id:'REFRESH_003',itemType:'SERVICE',drawCount:1,maxPerRefresh:4,weight:52}
      ]
    },
    {
      id:'AI2',stageNodeId:'N08',offerSlotCount:4,decisionStatus:'PROTOTYPE_ASSUMPTION',fieldDecisionStatus:{offerSlotCount:'CONFIRMED',typeWeights:'PROTOTYPE_ASSUMPTION'},
      typeRules:[
        {id:'REFRESH_005',itemType:'CARD',drawCount:1,maxPerRefresh:4,weight:35},
        {id:'REFRESH_006',itemType:'PERSONA',drawCount:1,maxPerRefresh:1,weight:10},
        {id:'REFRESH_007',itemType:'SERVICE',drawCount:1,maxPerRefresh:4,weight:55}
      ]
    },
    {
      id:'AI3',stageNodeId:'N12',offerSlotCount:4,decisionStatus:'PROTOTYPE_ASSUMPTION',fieldDecisionStatus:{offerSlotCount:'CONFIRMED',typeWeights:'PROTOTYPE_ASSUMPTION'},
      typeRules:[
        {id:'REFRESH_008',itemType:'CARD',drawCount:1,maxPerRefresh:4,weight:30},
        {id:'REFRESH_009',itemType:'PERSONA',drawCount:1,maxPerRefresh:1,weight:12},
        {id:'REFRESH_010',itemType:'SERVICE',drawCount:1,maxPerRefresh:4,weight:58}
      ]
    }
  ];
  const poolEntries=[
    ...cardItems.map((item,index)=>({id:`POLL_CARD_${pad(index+1)}`,poolType:'CARD',itemId:item.id,weight:1})),
    ...personaItems.map(item=>({id:item.id.replace('SHOP_PER_','POOL_PERSONA_'),poolType:'PERSONA',itemId:item.id,weight:1})),
    ...serviceItems.map((item,index)=>({id:`POOL_SERVICE_${pad(index+1)}`,poolType:'SERVICE',itemId:item.id,weight:1}))
  ];
  modules.targetShop={
    id:'TARGET_SHOP_V1',
    version:3,
    itemTypes:['CARD','PERSONA','SERVICE'],
    selectionPolicy:{mode:'CATEGORY_THEN_ITEM',withoutReplacement:true},
    items:[...cardItems,...personaItems,...serviceItems],
    refreshProfiles,
    poolEntries,
    assumptions:{
      offerSlotCount:{value:4,decisionStatus:'CONFIRMED',reason:'策划已确认本阶段不调整商品卡槽位。'},
      purchaseLimitScope:{value:'SHOP_VISIT',decisionStatus:'CONFIRMED',reason:'刷新后仍按整个商店节点限购，避免借刷新重复购买同一商品。'},
      refreshPrice:{...modules.targetEconomy.refreshPrice,decisionStatus:'CONFIRMED'},
      personaRefreshControl:{maxPerRefresh:1,decisionStatus:'PROTOTYPE_ASSUMPTION',reason:'降低人格商品挤占普通成长商品的体感；概率待完整局遥测校准。'},
      personaCatalogSource:{value:'BASE_PERSONA_TEMPLATES',decisionStatus:'CONFIRMED',reason:'新增预设基础人格时自动生成对应商品，但人格类别权重保持不变。'}
    },
    decisionStatus:'CONFIRMED'
  };
})(globalThis);
