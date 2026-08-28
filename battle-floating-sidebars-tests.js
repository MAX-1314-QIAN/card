const assert=require('assert'),fs=require('fs');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('battle-floating-sidebars.css','utf8');
assert(html.includes('battle-floating-sidebars.css?v=20260828-floating-v1'),'战斗页必须加载悬浮侧栏样式');
assert(css.includes('#battle-screen.game-frame>.persona-rail')&&css.includes('#battle-screen.game-frame>.boss-rail'),'左右侧栏必须使用战斗页限定选择器');
assert(css.includes('background:transparent')&&css.includes('backdrop-filter:none'),'左右整栏底板和整体模糊必须取消');
assert(css.includes('#battle-screen .persona{')&&css.includes('#battle-screen .boss-title,'),'左右信息必须改为独立悬浮组件');
for(const forbidden of ['.battle-stage','.cards','.battle-action-button','.score-preview'])assert(!css.includes(forbidden),`侧栏改版不得修改中央区域：${forbidden}`);
console.log('battle floating sidebars tests passed');
