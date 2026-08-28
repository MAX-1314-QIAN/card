(function(global){
  const root='assets/art/cards/';
  const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const cards={};
  ranks.forEach((rank,index)=>{cards[`♠${rank}`]=`${root}image${String(index+1).padStart(3,'0')}.png`});
  ranks.forEach((rank,index)=>{cards[`♥${rank}`]=`${root}image${String(index+14).padStart(3,'0')}.png`});
  ranks.forEach((rank,index)=>{cards[`♣${rank}`]=`${root}image${String(index+27).padStart(3,'0')}.png`});
  ranks.forEach((rank,index)=>{cards[`♦${rank}`]=`${root}image${String(index+40).padStart(3,'0')}.png`});
  global.CARD_ART_MANIFEST=Object.freeze({
    version:'2026-08-27-full-deck-v2',
    usage:'ALL_CARD_SURFACES',
    cards:Object.freeze(cards)
  });
})(globalThis);
