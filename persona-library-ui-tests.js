const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const game=fs.readFileSync('game.js','utf8');
const css=fs.readFileSync('art-assets.css','utf8');
const render=game.slice(game.indexOf('function renderPersonaLibrary()'),game.indexOf('function selectPersonaLibrary'));

assert(render.includes('library-effect-summary'),'左侧人格卡应生成单句大白话效果');
assert(game.includes('persona-keyword')&&game.includes('persona-value'),'关键词和效果数值应使用独立强调标记');
assert(!render.includes('${p.mode} · 人格牌'),'左侧人格卡不应显示模式/人格牌小标签');
assert(!render.includes('<small>${p.effect}</small>'),'装备槽不应显示详细效果');
assert(!html.includes('id="library-detail-tags"'),'右下详情不应保留模式和数值标签');
assert(!html.includes('id="library-note"'),'右侧不应保留额外的小号说明区');
assert(html.includes('id="library-detail-desc"')&&html.includes('id="library-toggle-equip"'),'右下完整说明和装备操作必须保留');
assert(css.includes('.library-card.equipped:after{content:none}'),'已装备状态不得再生成小标签');
assert(game.includes('class="persona-battle-summary"'),'战斗左侧人格卡应使用大白话效果摘要');
assert(!game.includes('class="persona-guidance"'),'战斗左侧人格卡不应再生成触发/获得/当前多行说明');
assert(!game.includes('class="persona-rule-detail"'),'战斗左侧人格卡不应再生成精确规则入口');
assert(css.includes('.persona-copy .persona-keyword')&&css.includes('.persona-copy .persona-value'),'战斗左侧卡的条件关键词和效果数值必须突出显示');

const loadoutMarkup=render.match(/return `<div class="loadout-slot[\s\S]*?<\/div>`/i)?.[0]||'';
assert(loadoutMarkup.indexOf('loadout-index')<loadoutMarkup.indexOf('loadout-portrait'),'装备槽必须先显示序号，再显示头像');
assert(loadoutMarkup.indexOf('loadout-portrait')<loadoutMarkup.indexOf('<b>'),'装备槽必须在头像后显示名称');

console.log('persona-library-ui-tests: simplified cards, loadout and detail hierarchy passed');
