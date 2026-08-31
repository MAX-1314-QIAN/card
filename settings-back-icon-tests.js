const assert=require('assert'),fs=require('fs');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('settings-back-icon.css','utf8');
assert(html.includes('settings-back-icon.css?v=20260831-imagegen-v1'),'设置页必须加载返回图标样式');
const start=html.indexOf('<button id="settings-back"'),end=html.indexOf('</button>',start),button=html.slice(start,end);
assert(button.includes('aria-label="返回"')&&button.includes('title="返回"'),'图标按钮必须保留明确的返回语义');
assert(button.includes('assets/art/settings/back-icon-v1.png')&&fs.existsSync('assets/art/settings/back-icon-v1.png'),'设置页必须接入生成的透明返回图标');
assert(!button.includes('← 返回'),'旧版文字返回按钮必须移除');
assert(css.includes('width:54px')&&css.includes('width:52px')&&css.includes('transition:filter .16s ease'),'返回图标必须使用清晰、稳定且无位移动效的按钮样式');
console.log('settings back icon tests passed');
