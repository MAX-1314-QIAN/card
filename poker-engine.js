(function(root,factory){
  const engine=factory();
  root.PokerEngine=engine;
  if(typeof module!=='undefined'&&module.exports)module.exports=engine;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SUITS=[['♠','black'],['♥','red'],['♦','red'],['♣','black']];
  const RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

  function createStandardDeck({uidPrefix='base'}={}){
    let uid=0;
    return RANKS.flatMap((rank,rankIndex)=>SUITS.map(([suit,color],suitIndex)=>({
      r:rank,ri:rankIndex+2,s:suit,c:color,si:suitIndex,
      templateId:`base-${uid}`,uid:`${uidPrefix}-${uid++}`,bonus:0
    })));
  }

  function shuffle(cards,random=Math.random){
    for(let index=cards.length-1;index>0;index--){
      const target=Math.floor(random()*(index+1));
      [cards[index],cards[target]]=[cards[target],cards[index]];
    }
    return cards;
  }

  function faceChipValue(card){
    return card.r==='A'?11:['J','Q','K'].includes(card.r)?10:Number(card.r);
  }

  function evaluate(cards,handTypes,maxSelection=5){
    if(!Array.isArray(cards)||cards.length<1||cards.length>maxSelection)throw new Error('PokerEngine.evaluate requires 1..maxSelection cards');
    const orderedTypes=[...handTypes].sort((a,b)=>b.priority-a.priority),values=cards.map(card=>card.ri).sort((a,b)=>a-b),counts={};
    cards.forEach(card=>counts[card.ri]=(counts[card.ri]||0)+1);
    const amounts=Object.values(counts).sort((a,b)=>b-a),flush=cards.length===maxSelection&&cards.every(card=>card.si===cards[0].si),unique=[...new Set(values)];
    const straight=cards.length===maxSelection&&unique.length===maxSelection&&(unique[maxSelection-1]-unique[0]===maxSelection-1||JSON.stringify(unique)==='[2,3,4,5,14]');
    const matches={straight_flush:flush&&straight,four_kind:amounts[0]===4,full_house:amounts[0]===3&&amounts[1]===2,flush,straight,three_kind:amounts[0]===3,two_pair:amounts[0]===2&&amounts[1]===2,pair:amounts[0]===2,high_card:true};
    const typeConfig=orderedTypes.find(config=>matches[config.id])||orderedTypes.find(config=>config.id==='high_card');
    let scoringCards;
    if(typeConfig.scoringRule==='ALL')scoringCards=[...cards];
    else if(typeConfig.scoringRule==='MATCHED_RANKS'){
      const scoringRanks=new Set(Object.entries(counts).filter(([,amount])=>amount>=2).map(([rank])=>Number(rank)));
      scoringCards=cards.filter(card=>scoringRanks.has(card.ri));
    }else scoringCards=[cards.reduce((highest,card)=>card.ri>highest.ri?card:highest)];
    return{type:typeConfig.name,typeId:typeConfig.id,chips:typeConfig.chips,mult:typeConfig.mult,flush,straight,pair:amounts[0]>=2,scoringCards};
  }

  function nakedScore(cards,handTypes,maxSelection=5){
    const result=evaluate(cards,handTypes,maxSelection),faceChips=result.scoringCards.reduce((sum,card)=>sum+faceChipValue(card)+(card.bonus||0),0),chips=result.chips+faceChips;
    return{...result,faceChips,total:Math.max(1,Math.round(chips*result.mult)),totalChips:chips};
  }

  return{SUITS,RANKS,createStandardDeck,shuffle,faceChipValue,evaluate,nakedScore};
});
