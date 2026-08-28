const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('shop-scroll.css','utf8');
const game=fs.readFileSync('game.js','utf8');
const affixCss=fs.readFileSync('persona-affixes.css','utf8');

for(const id of ['shop-item-list','shop-detail-limit','shop-buy','shop-note'])assert.ok(html.includes(`id="${id}"`),`missing shop UI ${id}`);
assert.ok(html.includes('aria-label="商品列表，可上下滚动"'));
assert.ok(html.includes('id="shop-forge-panel" class="hidden" hidden'),'persona forge panel must start natively hidden before JavaScript initializes');
assert.ok(html.indexOf('shop-prototype.css')<html.indexOf('shop-scroll.css'),'scroll overrides must load after the base shop theme');
assert.ok(html.indexOf('balance/target/shop-config.js')<html.indexOf('balance/schema-validation.js'),'shop config must load before schema and manifest');
assert.ok(html.indexOf('shop/shop-runtime.js')<html.indexOf('game.js'),'shop runtime must load before game integration');

assert.match(css,/\.shop-item-list,\.shop-forge-list[\s\S]*overflow-y:scroll/);
assert.match(css,/height:429px/,'desktop lists should expose exactly four fixed-height slots');
assert.match(css,/grid-auto-rows:102px/,'goods and persona slots should share the same compact row height');
assert.match(css,/height:min\(760px,calc\(100dvh - 40px\)\)/,'desktop shop should use a compact bounded viewport');
assert.ok(html.indexOf('shop-forge-interaction.css')<html.indexOf('shop-scroll.css'),'scroll sizing overrides must load after forge item styles');
assert.match(css,/scrollbar-gutter:stable/);
assert.match(css,/::-webkit-scrollbar-thumb/);
assert.match(css,/\.shop-dialog[\s\S]*overflow:hidden/);
assert.match(css,/\.shop-dialog:not\(\[open\]\)\{display:none\}/,'a closed shop dialog must never enter normal document flow');
assert.match(css,/\[hidden\]\{display:none!important\}/,'native hidden state must outrank desktop panel display rules');
assert.match(css,/\.shop-dialog\[open\][\s\S]*display:grid/,'the desktop grid layout must apply only while the dialog is open');
assert.ok(!/@media \(min-width:901px\)\{\s*\.shop-dialog\s*\{[\s\S]*?display:grid/.test(css),'do not force closed dialogs to display');

assert.ok(!game.includes('const shopServices='),'legacy hard-coded service catalog must be removed');
assert.ok(!game.includes('const prices={trim:4,temper:6,breath:5}'),'legacy duplicate prices must be removed');
assert.match(game,/ShopRuntime\.generateOffers\(\{config:shopConfig,profileId/);
assert.match(game,/setNodeRuntime\(\{shopSession:/);
assert.match(game,/SHOP_PURCHASE:\$\{currentStageNode\(\)\?\.id\}/);
assert.match(game,/\$\('#shop-buy'\)\.onclick=\(\)=>buyShopItem\(selectedShopItemId\)/);
assert.match(game,/function deckCardsForTab\(\)\{if\(deckShopItemId\)return runDeck/);
assert.match(game,/ShopRuntime\.applyCardUpgrade/);
assert.match(game,/personaRuntime\.createInstance\(item\.effect\.personaTemplateId/);
assert.match(game,/ShopRuntime\.createCardFromItem/);
assert.match(game,/earnedThisBattle\+=reward/,'battle settlement must preserve card-earned gold and add the configured battle reward');

const renderShopBody=game.slice(game.indexOf('function renderShop(){'),game.indexOf('function setShopTab('));
assert.ok(!renderShopBody.includes('renderShopForge()'),'goods rendering must not overwrite its detail with persona forge detail');
const tabSwitchBody=game.slice(game.indexOf('function setShopTab('),game.indexOf('function openShop('));
assert.ok(tabSwitchBody.includes('goodsPanel.hidden=forge')&&tabSwitchBody.includes('forgePanel.hidden=!forge'),'tab switching must synchronize native hidden state and CSS state');
assert.ok(tabSwitchBody.indexOf("setAttribute('aria-selected'")<tabSwitchBody.indexOf('renderShopForge()'),'tab selection must update before forge rendering so an unexpected render failure cannot leave mixed tab state');
assert.ok(html.includes('balance/base-personas.js?v=20260828-persona-art-v1'),'all confirmed persona affixes and portraits must bypass stale caches');
for(const asset of ['balance/schema-validation.js','persona/persona-effect-executor.js','persona/persona-feedback.js','persona/persona-runtime.js'])assert.ok(html.includes(`${asset}?v=20260826-flat-affixes-v5`),`flat affix runtime cache version missing: ${asset}`);
for(const asset of ['balance/manifest.js','persona/persona-condition-evaluator.js'])assert.ok(html.includes(`${asset}?v=20260826-persona-affix-v3`),`persona affix asset cache version missing: ${asset}`);
assert.ok(html.includes('game.js?v=20260828-battle-tools-v3'),'latest battle tools, persona card hierarchy, collection and resolution speed integration must use a new cache version');
assert.ok(html.includes('persona/legacy-persona-adapter.js?v=20260826-affix-lineage-v3'),'legacy persona adapter cache must include affix lineage support');
assert.ok(game.includes('function inheritedPersonaAffixTemplate(')&&game.includes('personaRuntime.registerTemplate(inherited)'),'legacy D20 personas must inherit and persist their base persona affix rules');
assert.ok(html.includes('persona-affixes.css?v=20260826-shop-unified-v4'),'unified shop layout must bypass stale CSS caches');
assert.ok(game.includes("dialog.classList.toggle('forge-mode',forge)"),'persona forge must activate its dedicated spacious layout');
assert.ok(affixCss.includes('.shop-dialog[open]{width:min(1500px,97vw)')&&affixCss.includes('.shop-dialog .shop-layout{grid-template-columns:190px'),'goods and persona forge tabs must share the same outer dimensions and column widths');
assert.ok(affixCss.includes('min-height:64px')&&affixCss.includes('min-width:126px'),'persona affix rows and unlock buttons must keep comfortable readable dimensions');
assert.ok(game.includes('function shopPersonaPresentation(')&&game.includes('template.mainEffect?.triggerText'),'forge rendering must normalize both formal base personas and growth personas');
assert.ok(!game.slice(game.indexOf('function renderShopForge(){'),game.indexOf('function renderShop(){')).includes('template.mainEffect.triggerText'),'forge list must not dereference base-only fields on growth personas');

console.log('shop-ui-tests: independent draggable list scroll, config/runtime loading, generic purchase routing and detail separation passed');
