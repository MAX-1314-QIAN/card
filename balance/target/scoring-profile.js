(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  const source='人格牌游戏_数值原型母表_V1.0.xlsx / 03_计分与基线';
  modules.targetScoringProfile={
    id:'POKER_HAND_PROFILE_TARGET_V1',
    decisionStatus:'DERIVED',
    formula:'derivedTargetBaseChips = targetSingleHandScore / multiplier - typicalFaceChips',
    faceChipModel:'A=11, J/Q/K=10, number=face value; scoring cards depend on the shared poker recognizer',
    hands:[
      {id:'straight_flush',name:'同花顺',english:'STRAIGHT FLUSH',priority:9,mult:10,rawBaseChips:95,targetSingleHandScore:950,typicalFaceChips:51,derivedTargetBaseChips:44,chips:44,scoringRule:'ALL',icon:'10 J Q K A',iconClass:'red sequence',description:'五张花色相同且点数连续的牌。',decisionStatus:'DERIVED',source},
      {id:'four_kind',name:'四条',english:'FOUR OF A KIND',priority:8,mult:6,rawBaseChips:100,targetSingleHandScore:600,typicalFaceChips:32,derivedTargetBaseChips:68,chips:68,scoringRule:'MATCHED_RANKS',icon:'♠♠♠♠',description:'四张点数相同的牌。',decisionStatus:'DERIVED',source},
      {id:'full_house',name:'葫芦',english:'FULL HOUSE',priority:7,mult:5,rawBaseChips:74,targetSingleHandScore:370,typicalFaceChips:34,derivedTargetBaseChips:40,chips:40,scoringRule:'ALL',icon:'♣♣♣<br>♦♦',description:'一组三条与一组对子同时成立。',decisionStatus:'DERIVED',source},
      {id:'flush',name:'同花',english:'FLUSH',priority:6,mult:4,rawBaseChips:65,targetSingleHandScore:260,typicalFaceChips:36,derivedTargetBaseChips:29,chips:29,scoringRule:'ALL',icon:'♥ ♥ ♥ ♥ ♥',iconClass:'red',description:'五张花色相同、点数不连续的牌。',decisionStatus:'DERIVED',source},
      {id:'straight',name:'顺子',english:'STRAIGHT',priority:5,mult:4,rawBaseChips:60,targetSingleHandScore:240,typicalFaceChips:35,derivedTargetBaseChips:25,chips:25,scoringRule:'ALL',icon:'5 6 7 8 9',iconClass:'sequence',description:'五张点数连续的牌；A 可作为最高或最低点。',decisionStatus:'DERIVED',source},
      {id:'three_kind',name:'三条',english:'THREE OF A KIND',priority:4,mult:3,rawBaseChips:57,targetSingleHandScore:170,typicalFaceChips:24,derivedTargetBaseChips:32.666666666666664,chips:32.666666666666664,scoringRule:'MATCHED_RANKS',icon:'♦♦♦',description:'三张点数相同的牌。',decisionStatus:'DERIVED',source},
      {id:'two_pair',name:'两对',english:'TWO PAIR',priority:3,mult:2.5,rawBaseChips:52,targetSingleHandScore:130,typicalFaceChips:34,derivedTargetBaseChips:18,chips:18,scoringRule:'MATCHED_RANKS',icon:'♠♠<br>♥♥',description:'两组不同点数的对子。',decisionStatus:'DERIVED',source},
      {id:'pair',name:'对子',english:'PAIR',priority:2,mult:2,rawBaseChips:48,targetSingleHandScore:95,typicalFaceChips:16,derivedTargetBaseChips:31.5,chips:31.5,scoringRule:'MATCHED_RANKS',icon:'♣♣',description:'两张点数相同的牌。',decisionStatus:'DERIVED',source},
      {id:'high_card',name:'高牌',english:'HIGH CARD',priority:1,mult:1,rawBaseChips:55,targetSingleHandScore:55,typicalFaceChips:11,derivedTargetBaseChips:44,chips:44,scoringRule:'HIGHEST',icon:'♠',description:'未形成其他牌型，计算点数最高的一张牌。',decisionStatus:'DERIVED',source}
    ]
  };
})(globalThis);
