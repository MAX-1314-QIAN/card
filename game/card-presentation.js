(function(root){
  'use strict';

  function create({manifest,escapeHtml}={}){
    const escape=typeof escapeHtml==='function'?escapeHtml:value=>String(value??'');
    const artPath=card=>manifest?.cards?.[`${card.s}${card.r}`]||null;
    const artClass=card=>artPath(card)?'has-card-art':'';
    const artImage=(card,className='card-art-image')=>{const art=artPath(card);return art?`<img class="${escape(className)}" src="${escape(art)}" alt="" draggable="false">`:''};
    function faceMarkup(card){
      const bonus=card.bonus?`<em class="card-bonus">+${card.bonus}</em>`:'',art=artPath(card);
      if(art)return`${artImage(card)}${bonus}`;
      const corner=`${bonus}<span class="corner top"><b class="corner-rank">${card.r}</b><i class="corner-suit">${card.s}</i></span><span class="corner bottom"><b class="corner-rank">${card.r}</b><i class="corner-suit">${card.s}</i></span>`;
      if(card.r==='A')return`${corner}<span class="ace-field"><i class="ace-suit">${card.s}</i></span>`;
      if(['J','Q','K'].includes(card.r))return`${corner}<span class="court-field"><i class="court-letter">${card.r}</i><i class="court-suit">${card.s}</i></span>`;
      const layouts={
        '2':[2,14],'3':[2,8,14],'4':[1,3,13,15],'5':[1,3,8,13,15],
        '6':[1,3,7,9,13,15],'7':[1,3,5,7,9,13,15],
        '8':[1,3,5,7,9,11,13,15],'9':[1,3,5,7,8,9,11,13,15],
        '10':[1,2,3,5,7,9,11,13,14,15]
      },pips=(layouts[card.r]||[]).map(cell=>{const row=Math.ceil(cell/3),col=(cell-1)%3+1;return`<i class="pip ${row>=4?'flipped':''}" style="grid-area:${row}/${col}">${card.s}</i>`}).join('');
      return`${corner}<span class="pip-field">${pips}</span>`;
    }
    return Object.freeze({artPath,artClass,artImage,faceMarkup});
  }

  root.GameCardPresentation=Object.freeze({create});
})(globalThis);
