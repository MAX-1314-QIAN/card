const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('settings-layout-reference.css','utf8');
const background=fs.readFileSync('background-art.css','utf8');

assert(html.includes('settings-layout-reference.css?v=20260827-reference-layout-v1'),'页面必须加载参考图设置布局覆盖层');
assert(background.includes('--background-settings:url("assets/art/backgrounds/image081.png")'),'设置页必须继续使用既定 image081 背景');
assert(css.includes('background:rgba(7,6,5,.90)!important'),'主设置面板必须使用约90%不透明底色');
assert(css.includes('grid-template-columns:1fr 1fr'),'画面和声音必须并排');
assert(css.includes('.controls-card')&&css.includes('grid-column:1/-1'),'操作区必须横跨整行');
assert(css.includes('grid-template-columns:repeat(3,minmax(160px,1fr))'),'底部操作必须按三列排列');
assert(!css.includes('opacity:.90'),'不得通过整体 opacity 降低文字和控件清晰度');

console.log('settings layout reference tests passed');
