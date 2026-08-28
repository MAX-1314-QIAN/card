(function(root){
  'use strict';
  const SUIT_ORDER=Object.freeze({'♥':0,'♦':1,'♣':2,'♠':3});
  function rankIndex(card){const value=Number(card?.ri);return Number.isFinite(value)?value:0}
  function sortCards(cards,mode='rank'){
    if(!Array.isArray(cards))return[];
    const normalizedMode=mode==='suit'?'suit':'rank';
    return cards.map((card,index)=>({card,index})).sort((left,right)=>{
      const a=left.card,b=right.card;
      const rankDelta=rankIndex(b)-rankIndex(a);
      const suitDelta=(SUIT_ORDER[a?.s]??99)-(SUIT_ORDER[b?.s]??99);
      return(normalizedMode==='suit'?(suitDelta||rankDelta):(rankDelta||suitDelta))||(left.index-right.index);
    }).map(entry=>entry.card)
  }
  root.DeckSortRuntime=Object.freeze({sortCards,suitOrder:SUIT_ORDER});
})(globalThis);
