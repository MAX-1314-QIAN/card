const assert=require('assert'),fs=require('fs');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('battle-viewport-lock.css','utf8');
assert(html.includes('battle-viewport-lock.css?v=20260828-no-page-scrollbar-v1'),'页面必须加载战斗视口锁定样式');
assert(css.includes('#battle-screen:not(.hidden)'),'视口锁定只能在战斗画面显示时生效');
assert(css.includes('overflow:hidden')&&css.includes('scrollbar-width:none')&&css.includes('::-webkit-scrollbar'),'必须同时阻止页面溢出并兼容隐藏浏览器滚动条');
assert(css.includes('height:100vh')&&css.includes('min-height:100vh'),'战斗画面必须固定为单视口高度');
for(const forbidden of ['dialog','.shop-dialog','.settings-content','.persona-dialog'])assert(!css.includes(forbidden),`不得隐藏内部可滚动区域：${forbidden}`);
console.log('battle viewport lock tests passed');
