const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const polish=fs.readFileSync('settings-polish.css','utf8');
const overrides=fs.readFileSync('shell-overrides.css','utf8');

for(const removed of ['settings-help','简易设置','快速返回','本地保存'])assert.ok(!html.includes(removed),`removed settings sidebar content remains: ${removed}`);
for(const retained of ['画面','声音','操作','返回主界面','恢复默认','取消','保存设置'])assert.ok(html.includes(retained),`required settings control is missing: ${retained}`);
for(const audioControl of ['id="master-volume"','id="music-enabled"','id="sfx-enabled"'])assert.ok(html.includes(audioControl),`required audio control is missing: ${audioControl}`);
for(const speedLabel of ['1.0×','1.5×','2.0×','标准','流畅','快速'])assert.ok(html.includes(speedLabel),`settlement speed label is missing: ${speedLabel}`);
assert.ok(html.includes('<span>弃牌</span><kbd>D</kbd>'),'discard shortcut must display the actual D key');
assert.ok(html.includes('<span>设置 / 返回</span><kbd>Esc</kbd>'),'settings shortcut must display the actual Esc key');
assert.ok(!html.includes('<kbd>弃牌键</kbd>')&&!html.includes('<kbd>退出键</kbd>'),'generic shortcut labels must not remain');
assert.match(polish,/\.settings-layout\.settings-simple\{width:min\(1000px,100%\)[^}]*grid-template-columns:minmax\(0,1fr\)/,'settings content must use a centered single-column layout');
assert.match(polish,/\.settings-actions\{width:min\(1000px,100%\)/,'settings actions must align to the optimized content width');
assert.ok(!polish.includes('grid-template-columns:minmax(0,1fr) 275px'),'the removed sidebar column must not remain');
assert.ok(!overrides.includes('300px'),'legacy sidebar width must not remain in overrides');

console.log('settings-ui-tests: sidebar removed, controls retained and single-column layout aligned passed');
