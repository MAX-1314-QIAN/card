const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const game=fs.readFileSync('game.js','utf8');
const shell=fs.readFileSync('shell.js','utf8');
const css=fs.readFileSync('persona-prebattle-loadout.css','utf8');
const galleryRender=game.slice(game.indexOf('function renderPersonaLibrary()'),game.indexOf('window.openPersonaLibrary'));
const loadoutRender=game.slice(game.indexOf('function renderStartLoadout()'),game.indexOf('window.openStartPersonaLoadout'));

assert(html.includes('<h2>人格图鉴</h2>')&&html.includes('id="persona-library"'),'主界面人格入口必须是只读图鉴');
for(const removedId of ['loadout-slots','library-toggle-equip','persona-done','persona-mode-filter','persona-search','library-detail-desc'])assert(!html.includes(`id="${removedId}"`),`图鉴不得保留装备时代控件：${removedId}`);
assert(!html.includes('保存装备')&&!html.includes('>卸下<'),'图鉴不得出现保存或卸下操作');
assert(galleryRender.includes('portraitOnlyCard')&&!galleryRender.includes('library-effect-summary')&&!galleryRender.includes('<h3>'),'图鉴一级卡片必须只显示原画与边框');
assert(game.includes('function openPersonaDetail(id)')&&html.includes('id="persona-detail-dialog"'),'点击人格原画必须打开独立二级详情窗口');
assert(game.includes('personaAffixMarkup(template,null)'),'二级详情必须读取永久蓝图的词条状态，不得读取局内实例');

for(const id of ['start-loadout-dialog','start-loadout-slots','start-loadout-library','start-loadout-count','start-loadout-confirm'])assert(html.includes(`id="${id}"`),`缺少开局装备控件：${id}`);
assert(loadoutRender.includes('new Array(battleConfig.personaSlots)')&&loadoutRender.includes('data-loadout-slot'),'开局准备必须生成配置数量的装备槽');
assert(loadoutRender.includes('portraitOnlyCard')&&!loadoutRender.includes('mainEffect')&&!loadoutRender.includes('effectText'),'开局牌库一级卡片不得展示规则文字');
assert(loadoutRender.includes('ondragstart')&&loadoutRender.includes('ondragover')&&loadoutRender.includes('ondrop'),'人格牌必须支持拖放到装备槽');
assert(game.includes("localStorage.setItem('persona-loadout'")&&game.includes('window.confirmStartRunWithLoadout?.()'),'确认阵容后必须保存四槽并移交正式开局流程');
assert(shell.includes('window.openStartPersonaLoadout()')&&shell.includes('window.confirmStartRunWithLoadout=beginRunWithConfirmedLoadout'),'开始游戏必须先进入装备窗口，确认后才启动正式流程');
assert(css.includes('grid-template-columns:repeat(4,1fr)')&&css.includes('flex:0 0 clamp(132px,13vw,150px)'),'桌面版必须清楚区分四槽装备区和独立原画牌库卡位');
assert(css.includes('display:flex;flex-wrap:wrap')&&css.includes('flex:0 0 clamp(180px,19vw,218px)'),'图鉴必须使用互不牵连的独立卡位，不得再由共同行高拉伸卡牌');
assert(css.includes('aspect-ratio:977/1610')&&css.includes('.gallery-card-art{position:absolute;inset:0;background-size:100% 100%}'),'图鉴原画必须完整遵循 977:1610 的源文件比例');
assert(css.includes('.start-loadout-persona-art{position:absolute;inset:0;background-size:100% 100%}'),'开局牌库原画也必须完整遵循源文件比例，不得出现共同行高黑块');

assert(game.includes('function personaLibraryBaseNumber(')&&game.includes("collectionSource!=='INITIAL_COLLECTION'")&&game.includes('return aNumber-bNumber'),'基础人格必须按数字编号升序显示');
assert(game.includes('permanentPersonaCards()')&&game.includes('collectionTemplate'),'图鉴和开局牌库必须包含永久带出的 AI 人格');
assert(game.includes('class="persona-battle-summary"'),'战斗左侧仍需展示已确认四张人格的效果摘要');
assert(!html.includes('id="exit-game"')&&!shell.includes("querySelector('#exit-game')"),'网页主界面不得恢复无效退出按钮');

console.log('persona-library-ui-tests: read-only gallery, portrait-only library, detail modal and pre-battle drag loadout passed');
