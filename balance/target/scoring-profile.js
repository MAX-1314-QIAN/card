(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const source='最新策划确认 / 手牌数值表 / 2026-08-24';
  modules.targetScoringProfile={
    id:'POKER_HAND_PROFILE_TARGET_V1',
    version:2,
    decisionStatus:'CONFIRMED',
    chipFormula:'(基础筹码 + 计分牌牌面筹码 + 卡牌筹码强化) × 基础倍率 × 其他倍率层',
    faceChipModel:'A=11, J/Q/K=10, number=face value; scoringCardCount limits which recognized cards contribute face chips',
    hands:[
      {handId:'HAND_11',id:'royal_flush',name:'皇家同花顺',english:'ROYAL FLUSH',priority:11,displayOrder:11,scoringCardCount:4,qualityId:'RARE',chips:100,mult:12,scoringRule:'ALL',icon:'10 J Q K A',iconClass:'red sequence',description:'五张同花色的 10、J、Q、K、A；按配置取最高四张参与牌面筹码。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_10',id:'flush_house',name:'同花葫芦',english:'FLUSH HOUSE',priority:10,displayOrder:10,scoringCardCount:5,qualityId:'RARE',chips:70,mult:12,scoringRule:'ALL',icon:'♣♣♣<br>♣♣',description:'同一花色中同时形成一组三条与一组对子；可由本局新增的重复卡牌组成。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_09',id:'straight_flush',name:'同花顺',english:'STRAIGHT FLUSH',priority:9,displayOrder:9,scoringCardCount:5,qualityId:'RARE',chips:95,mult:10,scoringRule:'ALL',icon:'5 6 7 8 9',iconClass:'red sequence',description:'五张花色相同且点数连续的牌。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_08',id:'four_kind',name:'四条',english:'FOUR OF A KIND',priority:8,displayOrder:8,scoringCardCount:4,qualityId:'RARE',chips:100,mult:6,scoringRule:'MATCHED_RANKS',icon:'♠♠♠♠',description:'四张点数相同的牌。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_07',id:'full_house',name:'葫芦',english:'FULL HOUSE',priority:7,displayOrder:7,scoringCardCount:5,qualityId:'RARE',chips:74,mult:5,scoringRule:'ALL',icon:'♣♣♣<br>♦♦',description:'一组三条与一组对子同时成立。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_06',id:'flush',name:'同花',english:'FLUSH',priority:6,displayOrder:6,scoringCardCount:5,qualityId:'RARE',chips:65,mult:4,scoringRule:'ALL',icon:'♥ ♥ ♥ ♥ ♥',iconClass:'red',description:'五张花色相同、点数不连续的牌。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_05',id:'straight',name:'顺子',english:'STRAIGHT',priority:5,displayOrder:5,scoringCardCount:5,qualityId:'NORMAL',chips:60,mult:4,scoringRule:'ALL',icon:'5 6 7 8 9',iconClass:'sequence',description:'五张点数连续的牌；A 可作为最高或最低点。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_04',id:'three_kind',name:'三条',english:'THREE OF A KIND',priority:4,displayOrder:4,scoringCardCount:3,qualityId:'NORMAL',chips:57,mult:3,scoringRule:'MATCHED_RANKS',icon:'♦♦♦',description:'三张点数相同的牌。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_03',id:'two_pair',name:'两对',english:'TWO PAIR',priority:3,displayOrder:3,scoringCardCount:4,qualityId:'NORMAL',chips:52,mult:2.5,scoringRule:'MATCHED_RANKS',icon:'♠♠<br>♥♥',description:'两组不同点数的对子。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_02',id:'pair',name:'对子',english:'PAIR',priority:2,displayOrder:2,scoringCardCount:2,qualityId:'NORMAL',chips:48,mult:2,scoringRule:'MATCHED_RANKS',icon:'♣♣',description:'两张点数相同的牌。',decisionStatus:'CONFIRMED',source},
      {handId:'HAND_01',id:'high_card',name:'高牌',english:'HIGH CARD',priority:1,displayOrder:1,scoringCardCount:1,qualityId:'NORMAL',chips:55,mult:1,scoringRule:'HIGHEST',icon:'♠',description:'未形成其他牌型，计算点数最高的一张牌。',decisionStatus:'CONFIRMED',source}
    ]
  };
})(globalThis);
