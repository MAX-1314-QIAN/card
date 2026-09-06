(function(root){
  'use strict';
  function cardSuit(card){return card?.suit??card?.s??null}
  function cardRankBand(card){
    if(card?.rankBand)return card.rankBand;
    const rank=String(card?.rank??card?.r??''),index=Number(card?.rankIndex??card?.ri);
    if(rank==='A')return'ace';
    if(['J','Q','K'].includes(rank))return'face';
    if(Number.isFinite(index))return index<=6?'low':'middle';
    return null;
  }
  function cardRank(card){return Number(card?.rankIndex??card?.ri)}
  function scoringRanks(context){return(context.scoringCards||[]).map(cardRank).filter(Number.isFinite)}
  function matchedRanks(context){const counts=new Map();for(const rank of scoringRanks(context))counts.set(rank,(counts.get(rank)||0)+1);return[...counts].filter(([,count])=>count>=2).map(([rank])=>rank)}
  function flushSuit(context){if(!context.flush)return null;const suits=(context.scoringCards||[]).map(cardSuit).filter(Boolean);return suits.length&&new Set(suits).size===1?suits[0]:null}
  function straightHigh(context){if(!context.straight)return null;const ranks=[...new Set(scoringRanks(context))].sort((a,b)=>a-b);return ranks.includes(14)&&[2,3,4,5].every(rank=>ranks.includes(rank))?5:(ranks.at(-1)??null)}
  function evaluate(condition,context,runtimeState){
    switch(condition.type){
      case'SUBMITTED_CARD_COUNT_AT_LEAST':return(context.submittedCards?.length||0)>=condition.value;
      case'SUBMITTED_CARD_COUNT_AT_MOST':return(context.submittedCards?.length||0)<=condition.value;
      case'SUBMITTED_CARD_COUNT_EXACT':return(context.submittedCards?.length||0)===condition.value;
      case'SCORING_CARD_COUNT_AT_LEAST':return(context.scoringCards?.length||context.scoringCardCount||0)>=condition.value;
      case'CURRENT_HAND_CARD_COUNT_BELOW':return(context.currentHandCardCount??Number.POSITIVE_INFINITY)<condition.value;
      case'HAND_PRIORITY_AT_LEAST':return(context.handPriority||0)>=condition.value;
      case'HAND_QUALITY_IS':return context.handQualityId===condition.value;
      case'HAND_TYPE_IS':return context.handType===condition.value||context.handTypeId===condition.value;
      case'HAND_TYPE_IN':return condition.values.includes(context.handType)||condition.values.includes(context.handTypeId);
      case'SAME_HAND_TYPE_STREAK_AT_LEAST':return(context.sameHandTypeStreak||0)>=condition.value;
      case'DIFFERENT_FROM_PREVIOUS_HAND':return!!context.previousHandType&&context.previousHandType!==(context.handTypeId||context.handType);
      case'DISCARDED_CARD_COUNT_AT_LEAST':return(context.discardsUsedThisAction||0)>=condition.value;
      case'PERSONA_RUNTIME_FLAG':return runtimeState?.[condition.key]===(condition.value??true);
      case'UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN':return!(context.runHistory?.usedHandTypes||[]).includes(context.handTypeId||context.handType);
      case'HAND_HAS_STRAIGHT':return!!context.straight;
      case'MIN_UNIQUE_SUITS':return(context.uniqueSuitCount||0)>=condition.value;
      case'HAS_MATCHED_RANK_STRUCTURE':return!!context.hasMatchedRankStructure;
      case'HAND_HAS_FLUSH':return!!context.flush;
      case'SCORING_SUIT_COUNT_AT_LEAST':return(context.scoringCards||[]).filter(card=>cardSuit(card)===condition.suit).length>=condition.value;
      case'ALL_SCORING_CARDS_IN_RANK_BAND':{const cards=context.scoringCards||[];return cards.length>0&&cards.every(card=>cardRankBand(card)===condition.value)}
      case'HAND_PRIORITY_HIGHER_THAN_PREVIOUS':return Number.isFinite(context.previousHandPriority)&&Number(context.handPriority)>Number(context.previousHandPriority);
      case'REMAINING_HANDS_EXACT':return Number(context.remainingHands)===Number(condition.value);
      case'HAND_INDEX_EXACT':return Number(context.handIndex)===Number(condition.value);
      case'REMAINING_DISCARDS_AT_LEAST':return Number(context.remainingDiscards)>=Number(condition.value);
      case'MIN_SCORING_UNIQUE_SUITS':return Number(context.scoringUniqueSuitCount??new Set((context.scoringCards||[]).map(cardSuit).filter(Boolean)).size)>=Number(condition.value);
      case'PREVIOUS_HAND_TYPE_IS':return context.previousHandType===condition.value;
      case'PREVIOUS_SUBMITTED_CARD_COUNT_AT_MOST':return context.previousSubmittedCardCount!==null&&context.previousSubmittedCardCount!==undefined&&Number(context.previousSubmittedCardCount)<=Number(condition.value);
      case'CURRENT_FLUSH_SUIT_DIFFERS_FROM_PREVIOUS':{const suit=flushSuit(context);return!!suit&&!!context.previousFlushSuit&&suit!==context.previousFlushSuit}
      case'PERSONA_UNSEEN_HAND_TYPE':return!(runtimeState?.seenHandTypes||[]).includes(context.handTypeId||context.handType);
      case'PERSONA_UNSEEN_FLUSH_SUIT':{const suit=flushSuit(context);return!!suit&&!(runtimeState?.seenFlushSuits||[]).includes(suit)}
      case'PERSONA_UNSEEN_MATCHED_RANK':{const ranks=matchedRanks(context);return ranks.length>0&&ranks.some(rank=>!(runtimeState?.seenMatchedRanks||[]).includes(rank))}
      case'PERSONA_UNSEEN_STRAIGHT_HIGH':{const rank=straightHigh(context);return Number.isFinite(rank)&&!(runtimeState?.seenStraightHighs||[]).includes(rank)}
      case'PERSONA_RUNTIME_COUNTER_AT_LEAST':return Number(runtimeState?.[condition.key]||0)>=Number(condition.value);
      case'DISCARDED_SUIT_COUNT_AT_LEAST':return(context.discardedCards||[]).filter(card=>cardSuit(card)===condition.suit).length>=Number(condition.value);
      case'SCORING_CARDS_ALL_EVEN':{const ranks=scoringRanks(context);return ranks.length>0&&ranks.every(rank=>rank<=12&&rank%2===0)}
      case'SCORING_RANK_OVERLAPS_PREVIOUS':return scoringRanks(context).some(rank=>(context.previousScoringRanks||[]).includes(rank));
      default:return false;
    }
  }
  function evaluateAll(conditions,context,runtimeState){return(conditions||[]).every(condition=>evaluate(condition,context,runtimeState))}
  function evaluateDetailed(conditions,context,runtimeState){return(conditions||[]).map(condition=>({condition:JSON.parse(JSON.stringify(condition)),passed:evaluate(condition,context,runtimeState)}))}
  root.PersonaConditionEvaluator={evaluate,evaluateAll,evaluateDetailed};
})(globalThis);
