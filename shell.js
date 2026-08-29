const screens={menu:document.querySelector('#main-menu'),settings:document.querySelector('#settings-screen'),map:document.querySelector('#map-screen'),battle:document.querySelector('#battle-screen')};
let previousScreen='menu',runStarted=false,runResumeScreen='battle';
function showScreen(name){Object.values(screens).forEach(screen=>screen.classList.add('hidden'));screens[name].classList.remove('hidden');screens[name].classList.remove('screen-enter');void screens[name].offsetWidth;screens[name].classList.add('screen-enter');document.body.dataset.screen=name}
function openSettings(){previousScreen=screens.battle.classList.contains('hidden')?'menu':'battle';document.querySelector('#return-main-menu').classList.toggle('hidden',previousScreen!=='battle');document.querySelector('#replay-tutorial').classList.toggle('hidden',previousScreen!=='battle');loadSettings();showScreen('settings')}
function closeSettings(){showScreen(previousScreen)}
window.closeSettingsForTutorial=()=>showScreen('battle');
window.openSettingsFromTutorial=()=>{previousScreen='battle';loadSettings();showScreen('settings')};
function startRun(){if(!window.PERSONA_GAME_READY||!window.BALANCE_V21||!window.runController){document.querySelector('#menu-hint').textContent='游戏核心尚未完成加载，请刷新页面后重试。';return}const oldSave=window.runSave?.summary();if(oldSave&&!window.confirm('开始新游戏会覆盖当前进度，是否继续？'))return;window.clearRunSave?.();reset();runStarted=true;runResumeScreen='battle';showScreen('battle');window.runController.startRun(window.BALANCE_V21.meta.activeRunTemplateId)}
window.showRouteMap=()=>{runResumeScreen='map';showScreen('map')};
window.showBattleFromRoute=()=>{runResumeScreen='battle';showScreen('battle')};
window.goMainMenuFromRun=()=>{runStarted=false;runResumeScreen='battle';showScreen('menu');document.querySelector('#menu-hint').textContent='上一局已经结束，可以开始新的牌局'};
const defaults={brightness:100,volume:80,music:true,sfx:true,motion:true,shake:true,settlementSpeed:1};
function normalizedSettlementSpeed(value){const speed=Number(value);return speed===2?2:speed===1.5?1.5:1}
function readControls(){return{brightness:Number(document.querySelector('#brightness').value),volume:Number(document.querySelector('#master-volume').value),music:document.querySelector('#music-enabled').checked,sfx:document.querySelector('#sfx-enabled').checked,motion:document.querySelector('#ui-motion').checked,shake:document.querySelector('#screen-shake').checked,settlementSpeed:normalizedSettlementSpeed(document.querySelector('input[name="settlement-speed"]:checked')?.value)}}
function writeControls(settings){document.querySelector('#brightness').value=settings.brightness;document.querySelector('#master-volume').value=settings.volume;document.querySelector('#music-enabled').checked=settings.music;document.querySelector('#sfx-enabled').checked=settings.sfx;document.querySelector('#ui-motion').checked=settings.motion;document.querySelector('#screen-shake').checked=settings.shake;const speed=normalizedSettlementSpeed(settings.settlementSpeed);document.querySelector(`input[name="settlement-speed"][value="${speed}"]`).checked=true;updateSettingPreview()}
function loadSettings(){let saved=defaults;try{saved={...defaults,...JSON.parse(localStorage.getItem('persona-settings')||'{}')}}catch{}writeControls(saved)}
function updateSettingPreview(){const values=readControls();document.querySelector('#brightness-value').textContent=values.brightness+'%';document.querySelector('#volume-value').textContent=values.volume+'%';document.documentElement.style.filter=`brightness(${values.brightness}%)`;document.documentElement.classList.toggle('reduce-motion',!values.motion);document.documentElement.classList.toggle('allow-shake',values.motion&&values.shake);window.personaResolutionSpeed=values.settlementSpeed;window.applyAudioSettings?.(values)}
function saveSettings(){const values=readControls();localStorage.setItem('persona-settings',JSON.stringify(values));updateSettingPreview();closeSettings()}
document.querySelector('#start-game').onclick=startRun;
document.querySelector('#continue-game').onclick=()=>{if(window.runSave?.summary()){runStarted=true;if(!window.runSave.restore())document.querySelector('#menu-hint').textContent='存档无法恢复，请开始新游戏'}else if(runStarted)showScreen(runResumeScreen);else document.querySelector('#menu-hint').textContent='当前没有可继续的牌局'};
document.querySelector('#open-settings').onclick=openSettings;
document.querySelector('.gear').onclick=openSettings;
document.querySelector('#settings-back').onclick=()=>{loadSettings();closeSettings()};
document.querySelector('#settings-cancel').onclick=()=>{loadSettings();closeSettings()};
document.querySelector('#settings-save').onclick=saveSettings;
document.querySelector('#settings-default').onclick=()=>writeControls(defaults);
document.querySelector('#return-main-menu').onclick=()=>{loadSettings();window.commitRunSave?.('battle','return_to_menu');showScreen('menu');document.querySelector('#menu-hint').textContent='牌局已自动保存，可选择继续游戏返回'};
document.querySelector('#route-menu').onclick=()=>{showScreen('menu');document.querySelector('#menu-hint').textContent='路线选择已暂停，可继续当前牌局。'};
document.querySelector('#brightness').oninput=updateSettingPreview;
document.querySelector('#master-volume').oninput=updateSettingPreview;
document.querySelector('#music-enabled').onchange=updateSettingPreview;
document.querySelector('#sfx-enabled').onchange=updateSettingPreview;
document.querySelector('#ui-motion').onchange=updateSettingPreview;
document.querySelectorAll('input[name="settlement-speed"]').forEach(input=>input.onchange=updateSettingPreview);
document.querySelector('#open-gallery').onclick=()=>{const hint=document.querySelector('#menu-hint');if(typeof window.openPersonaLibrary!=='function'){hint.textContent='人格图鉴资源未完成加载，请刷新页面后重试。';return}try{window.openPersonaLibrary()}catch(error){console.error('人格图鉴打开失败',error);hint.textContent='人格图鉴打开失败，请刷新页面后重试。'}};
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!screens.settings.classList.contains('hidden')){loadSettings();closeSettings()}else if(!screens.battle.classList.contains('hidden'))openSettings()}});
function refreshContinueState(){const save=window.runSave?.summary(),button=document.querySelector('#continue-game');runStarted=!!save||runStarted;button.classList.toggle('has-save',!!save)}
window.addEventListener('run-save-changed',refreshContinueState);
loadSettings();showScreen('menu');refreshContinueState();if(window.runSave?.hadInvalidatedLegacySave?.())document.querySelector('#menu-hint').textContent='旧三战版本存档已失效，请开始新的 13 节点长局';
