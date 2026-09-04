(function(root){
  'use strict';
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  modules.targetEconomy={
    id:'TARGET_ECONOMY_V2',
    version:2,
    battleRewards:{
      cycleVictoryCoins:[5,5,6],
      finalBattleVictoryCoins:0,
      perRemainingHand:1,
      perRemainingDiscard:1
    },
    personaAffixes:{unlockCosts:[4,6]},
    shopPrices:{
      card:2,
      persona:10,
      cardChips:4,
      cardCoins:5,
      cardMultiplier:5,
      cardIndependentMultiplier:6,
      removeCard:4,
      buildUpgradeBase:7,
      buildUpgradePerTargetLevel:2
    },
    refreshPrice:{firstRefreshFree:true,basePaidPrice:1,increment:1,resetScope:'SHOP_VISIT'},
    decisionStatus:'CONFIRMED'
  };
})(globalThis);
