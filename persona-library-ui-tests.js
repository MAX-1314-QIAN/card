const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const game=fs.readFileSync('game.js','utf8');
const css=fs.readFileSync('art-assets.css','utf8');
const affixCss=fs.readFileSync('persona-affixes.css','utf8');
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
assert(render.includes('personaAffixMarkup(template,null)')&&render.includes('每局重新解锁第二、第三属性'),'局外图鉴必须显示副属性为每局重新解锁，且不得读取局内实例');
assert(!html.includes('id="target-loadout-dialog"')&&!game.includes('function renderTargetLoadout()'),'正式流程不得保留开局人格选择界面');
assert(game.includes('normalizedGalleryLoadout')&&game.includes("localStorage.setItem('persona-loadout'"),'开局装备必须统一读取人格图鉴保存方案');
assert(!game.includes('class="persona-runtime-status"'),'战斗左侧必须按最新界面要求移除当前触发状态');
assert(game.includes('function unlockPersonaAffix(')&&game.includes('personaRuntime.unlockSubAffix(instanceId,slotIndex,{profileId:currentShopProfileId()})'),'人格属性解锁底层能力必须继续保留');
assert(game.includes('getSubAffixUnlockAvailability')&&game.includes('需 ${availability.nextProfileId} 商店'),'未到开放节点的属性槽必须提前显示所需商店档位，不能等点击后才报错');
assert(html.includes('data-shop-tab="forge"')&&html.includes('id="shop-result" class="shop-forge-only shop-affix-slots"'),'人格铸造分页必须接回简洁的副属性槽位容器');
assert(!html.includes('id="shop-result-title"')&&!html.includes('人格属性详情'),'人格铸造页不得保留后台式详情标题或重复大标题');
assert(!html.includes('<option>映照</option>')&&!html.includes('<option>偏转</option>')&&!html.includes('<option>裂变</option>'),'基础人格图鉴不得继续展示临时模式分类');
assert(affixCss.includes('.persona-affix-slot')&&affixCss.includes('.persona-affix-slot.locked'),'副词条已解锁/未解锁必须有明确视觉状态');
const shell=fs.readFileSync('shell.js','utf8');
assert(shell.includes("typeof window.openPersonaLibrary!=='function'")&&shell.includes('人格图鉴打开失败'),'图鉴脚本缺失或渲染异常时必须给玩家明确反馈');
assert(game.includes('if(!dialog.open)dialog.showModal()'),'重复点击不得因为重复 showModal 导致图鉴异常');
assert(render.includes('presentation=shopPersonaPresentation(template,null)'),'图鉴详情必须只读取永久蓝图，不得读取局内解锁状态');
assert(game.includes('permanentPersonaCards()')&&game.includes('collectionTemplate'),'图鉴必须由永久收藏记录生成可装备人格卡');
assert(!render.includes('template.mainEffect.triggerText')&&!render.includes('template.mainEffect.effectText'),'图鉴不得直接读取仅基础人格拥有的主效果字段');
assert(!html.includes('id="exit-game"')&&!html.includes('退出游戏'),'网页主界面不得保留无效的退出游戏按钮');
assert(!shell.includes("querySelector('#exit-game')"),'主界面脚本不得继续绑定已删除的退出按钮');

const loadoutMarkup=render.match(/return `<div class="loadout-slot[\s\S]*?<\/div>`/i)?.[0]||'';
assert(loadoutMarkup.indexOf('loadout-index')<loadoutMarkup.indexOf('loadout-portrait'),'装备槽必须先显示序号，再显示头像');
assert(loadoutMarkup.indexOf('loadout-portrait')<loadoutMarkup.indexOf('<b>'),'装备槽必须在头像后显示名称');

console.log('persona-library-ui-tests: simplified cards, loadout and detail hierarchy passed');
