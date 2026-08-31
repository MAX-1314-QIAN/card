const assert=require('assert'),fs=require('fs');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('effects.css','utf8');
assert(html.includes('effects.css?v=20260831-static-score-v2'),'页面必须刷新全局动效样式缓存');
for(const keyframe of ['handCardAmbient','handArtworkDrift','handCardGlint'])assert(css.includes(`@keyframes ${keyframe}`),`缺少手牌动态效果：${keyframe}`);
assert(css.includes('.cards:not(.opening-deal-pending):not(.opening-deal-active) .playing-card:not(.selected)'),'环境动态不得干扰发牌与选中反馈');
assert(css.includes('.cards .playing-card:hover::after'),'悬停时必须提供牌面扫光反馈');
assert(css.includes('.reduce-motion .cards .playing-card'),'减少动态效果设置必须关闭手牌动画');
console.log('hand card motion tests passed');
