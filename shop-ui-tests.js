const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const scrollCss=fs.readFileSync('shop-scroll.css','utf8');
const simpleCss=fs.readFileSync('shop-simplified.css','utf8');
const game=fs.readFileSync('game.js','utf8');
const shopHtml=html.slice(html.indexOf('<dialog id="shop-dialog"'),html.indexOf('</dialog>',html.indexOf('<dialog id="shop-dialog"')));

for(const id of ['shop-coins','shop-deck-count','shop-persona-count','shop-item-list','shop-detail-icon','shop-detail-name','shop-detail-effect','shop-buy','shop-leave','shop-note'])assert.ok(html.includes(`id="${id}"`),`missing shop UI ${id}`);
assert.ok(html.includes('aria-label="商品列表，可上下滚动"'));
assert.ok(html.includes('<header class="shop-header"><h2>商店</h2></header>'),'shop header must contain only the title');
assert.ok(html.includes('data-shop-tab="goods"')&&html.includes('data-shop-tab="forge"'),'goods and persona forge tabs must be restored');
assert.ok(html.includes('id="shop-forge-panel" class="hidden" hidden'),'persona forge panel must start hidden');
for(const removed of ['幕间整备','金币只在本局有效；每件商品仅可购买一次。','<h3>商品列表</h3>','商品详情','完整说明','购买结果'])assert.ok(!html.includes(removed),`removed goods content remains: ${removed}`);
assert.ok(html.includes('id="shop-result" class="shop-forge-only shop-affix-slots"'),'forge tab must keep one focused sub-affix operation area');
for(const removed of ['人格属性详情','主词条：','触发：','解锁消耗','解锁进度','人格状态','第二、第三属性'])assert.ok(!shopHtml.includes(removed),`forge backend-style label remains: ${removed}`);
assert.ok(/<p class="shop-note" id="shop-note" aria-live="polite"><\/p>/.test(html),'shop feedback must remain non-visual and empty by default');

assert.ok(html.indexOf('shop-prototype.css')<html.indexOf('shop-scroll.css'),'scroll overrides must load after the base shop theme');
assert.ok(html.indexOf('background-art.css')<html.indexOf('shop-simplified.css'),'simplified shop layout must load after legacy and background styles');
assert.ok(html.includes('shop-simplified.css?v=20260829-shop-background-v5'),'shop background style cache version missing');
assert.match(scrollCss,/\.shop-dialog:not\(\[open\]\)\{display:none\}/,'closed shop dialog must stay out of document flow');
assert.ok(simpleCss.includes('grid-template-columns:220px 440px minmax(0,1fr)'),'simplified shop must keep resource, list and preview columns');
assert.ok(simpleCss.includes('.shop-forge-only{display:none!important}')&&simpleCss.includes('.forge-mode .shop-forge-only{display:grid!important}'),'forge details must stay hidden on goods and appear only in forge mode');
assert.ok(simpleCss.includes('.persona-forge-slot')&&simpleCss.includes('grid-template-columns:110px minmax(0,1fr) 150px'),'forge action area must use two concise slot rows');
assert.ok(simpleCss.includes('background:#07070678')&&simpleCss.includes('backdrop-filter:blur(1.5px)'),'shop columns must use a lighter translucent surface over the supplied background');
assert.ok(simpleCss.includes('.shop-footer .shop-note')&&simpleCss.includes('clip:rect(0 0 0 0)'),'purchase feedback must not occupy visible footer space');

const itemBody=game.slice(game.indexOf('function renderShopItems('),game.indexOf('function renderShopForgeDetail('));
assert.ok(itemBody.includes('class="shop-item-summary"')&&itemBody.includes('<small>◉ ${item.price}</small>'),'shop rows must keep only icon, name and price');
for(const removed of ['view.tag','view.effect','<em>','<p>'])assert.ok(!itemBody.includes(removed),`shop row still renders redundant content: ${removed}`);
const detailBody=game.slice(game.indexOf('function renderShopDetail('),game.indexOf('function selectShopItem('));
assert.ok(detailBody.includes("$('#shop-detail-effect').textContent=view.effect"),'detail must keep one necessary effect sentence');
assert.ok(detailBody.includes("icon.classList.remove('has-art')")&&detailBody.includes("icon.style.removeProperty('--portrait')"),'returning to goods must clear the persona portrait from the shared detail area');
assert.ok(game.includes('function shopPlayingCard(')&&game.includes("cardArtImage(card,'shop-card-thumbnail')"),'playing-card shop rows must reuse the full-deck art manifest');
assert.ok(detailBody.includes("cardArtImage(card,'shop-card-preview')")&&detailBody.includes("classList.toggle('has-playing-card'"),'playing-card shop detail must show the selected full card face');
assert.ok(simpleCss.includes('.shop-icon.has-playing-card')&&simpleCss.includes('.shop-card-preview'),'shop card artwork must have dedicated thumbnail and detail sizing');
for(const removed of ['shop-detail-tag','shop-detail-description','shop-detail-price','shop-detail-limit','shop-detail-status','shop-result'])assert.ok(!detailBody.includes(removed),`detail still writes removed module: ${removed}`);
const tabBody=game.slice(game.indexOf('function setShopTab('),game.indexOf('function openShop('));
assert.ok(tabBody.includes("tab==='forge'?'forge':'goods'")&&tabBody.includes('renderShopForge()'),'tab switching must route between goods and persona forge');
const forgeBody=game.slice(game.indexOf('function renderShopForge(){'),game.indexOf('function setShopTab('));
assert.ok(forgeBody.includes('shopPersonaEffectText(presentation)')&&forgeBody.includes("`${slots.filter(slot=>slot.unlocked).length}/${slots.length}`"),'forge rows must render only a concise main effect and sub-affix progress');
for(const removed of ['presentation.entryLabel','次级属性 ','成长人格 · 固定效果','shop-detail-tag','shop-detail-description','shop-detail-price','shop-detail-limit','shop-detail-status'])assert.ok(!forgeBody.includes(removed),`forge view still renders redundant field: ${removed}`);
assert.ok(game.includes('function personaForgeSlotMarkup(')&&game.includes('解锁·${slot.unlockCost}金币')&&game.includes("'<em>已解锁</em>'"),'forge slots must show their current state and real unlock action');

assert.match(game,/ShopRuntime\.generateOffers\(\{config:shopConfig,profileId/);
assert.match(game,/SHOP_PURCHASE:\$\{currentStageNode\(\)\?\.id\}/);
assert.match(game,/\$\('#shop-buy'\)\.onclick=\(\)=>buyShopItem\(selectedShopItemId\)/);
assert.match(game,/ShopRuntime\.applyCardUpgrade/);
assert.match(game,/personaRuntime\.createInstance\(item\.effect\.personaTemplateId/);
assert.match(game,/ShopRuntime\.createCardFromItem/);
assert.ok(html.includes('shop/shop-runtime.js?v=20260829-concise-copy-v1'),'concise shop copy runtime cache version missing');
assert.ok(html.includes('game.js?v=20260829-shop-card-art-v9'),'shop card art script cache version missing');

console.log('shop-ui-tests: concise goods and focused persona forge hierarchy passed');
