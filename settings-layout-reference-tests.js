const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('settings-layout-reference.css','utf8');
const background=fs.readFileSync('background-art.css','utf8');

assert(html.includes('settings-layout-reference.css?v=20260829-speed-title-v2'),'页面必须加载设置布局覆盖层最新样式');
assert(background.includes('--background-settings:url("assets/art/backgrounds/image081.png")'),'设置页必须继续使用既定 image081 背景');
assert(css.includes('background:rgba(7,6,5,.90)!important'),'主设置面板必须使用约90%不透明底色');
assert(css.includes('grid-template-columns:1fr 1fr'),'画面和声音必须并排');
assert(css.includes('.controls-card')&&css.includes('grid-column:1/-1'),'操作区必须横跨整行');
assert(css.includes('grid-template-columns:repeat(3,minmax(160px,1fr))'),'底部操作必须按三列排列');
assert(!css.includes('opacity:.90'),'不得通过整体 opacity 降低文字和控件清晰度');
assert(html.includes('<div class="settlement-speed-title">结算播放速度</div>'),'结算速度标题必须只保留六字主标题');
assert(!html.includes('控制计分牌、人格触发、数字演算与结算特效的播放速度。'),'结算速度说明小字必须移除');
assert(css.includes('.settlement-speed-title')&&css.includes('font-size:18px')&&css.includes('align-items:center'),'结算速度标题必须放大并与倍率选项居中对齐');

console.log('settings layout reference tests passed');
