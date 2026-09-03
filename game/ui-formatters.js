(function(root){
  'use strict';

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,char=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    })[char]);
  }

  function formatNumber(value){
    const number=Number(value);
    return Number.isInteger(number)?String(number):String(Number(number.toFixed(4)));
  }

  function stripMarkup(value){
    return String(value??'').replace(/<[^>]+>/g,'');
  }

  root.GameUiFormatters=Object.freeze({escapeHtml,formatNumber,stripMarkup});
})(globalThis);
