(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  modules.pokerHands=[
    {id:'straight_flush',name:'同花顺',english:'STRAIGHT FLUSH',priority:9,chips:100,mult:8,scoringRule:'ALL',icon:'10 J Q K A',iconClass:'red sequence',description:'五张花色相同且点数连续的牌。'},
    {id:'four_kind',name:'四条',english:'FOUR OF A KIND',priority:8,chips:60,mult:7,scoringRule:'MATCHED_RANKS',icon:'♠♠♠♠',description:'四张点数相同的牌。'},
    {id:'full_house',name:'葫芦',english:'FULL HOUSE',priority:7,chips:45,mult:4,scoringRule:'ALL',icon:'♣♣♣<br>♦♦',description:'一组三条与一组对子同时成立。'},
    {id:'flush',name:'同花',english:'FLUSH',priority:6,chips:35,mult:4,scoringRule:'ALL',icon:'♥ ♥ ♥ ♥ ♥',iconClass:'red',description:'五张花色相同、点数不连续的牌。'},
    {id:'straight',name:'顺子',english:'STRAIGHT',priority:5,chips:30,mult:4,scoringRule:'ALL',icon:'5 6 7 8 9',iconClass:'sequence',description:'五张点数连续的牌；A 可作为最高或最低点。'},
    {id:'three_kind',name:'三条',english:'THREE OF A KIND',priority:4,chips:20,mult:3,scoringRule:'MATCHED_RANKS',icon:'♦♦♦',description:'三张点数相同的牌。'},
    {id:'two_pair',name:'两对',english:'TWO PAIR',priority:3,chips:15,mult:2,scoringRule:'MATCHED_RANKS',icon:'♠♠<br>♥♥',description:'两组不同点数的对子。'},
    {id:'pair',name:'对子',english:'PAIR',priority:2,chips:10,mult:2,scoringRule:'MATCHED_RANKS',icon:'♣♣',description:'两张点数相同的牌。'},
    {id:'high_card',name:'高牌',english:'HIGH CARD',priority:1,chips:5,mult:1,scoringRule:'HIGHEST',icon:'♠',description:'未形成其他牌型，计算点数最高的一张牌。'}
  ];
})(globalThis);
