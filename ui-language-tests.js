const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const visibleText=html
  .replace(/<script[\s\S]*?<\/script>/gi,' ')
  .replace(/<style[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&[a-zA-Z0-9#]+;/g,' ')
  .replace(/\bEsc\b/g,' ');

assert(!/[A-Za-z]{2,}/.test(visibleText),'静态界面不应显示英文单词；扑克牌单字符点数 A/J/Q/K 除外');
assert(!/class="overline"/.test(html),'装饰性眉题小字应全部移除');
for(const id of ['new-game','continue-game','persona-library-entry','open-settings','quit-game']){
  const buttonBody=html.match(new RegExp(`<button[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/button>`,'i'))?.[1]||'';
  assert(!/<small/i.test(buttonBody),`主菜单按钮不应保留小号副标题：${id}`);
}
for(const phrase of ['人格协同','计分参考','按空格键确认','按弃牌键确认','牌库档案','铸造候选','帮助 / 规则说明']){
  assert(!visibleText.includes(phrase),`装饰性小字仍存在：${phrase}`);
}

const runtimeSources=['game.js','shell.js','tutorial.js','save-system.js']
  .map(file=>fs.readFileSync(file,'utf8'))
  .join('\n');
const forbiddenVisiblePhrases=[
  'Boss 规则','Boss 观察','Boss协议','BATTLE VICTORY','BATTLE FAILED',
  '投掷 D20','目标 Run','CONTINUE','网页 Demo','INTERLUDE SHOP',
  'QUIET CHAMBER','MIRROR ENGRAVING','UNKNOWN REFLECTION'
];
for(const phrase of forbiddenVisiblePhrases)assert(!runtimeSources.includes(phrase),`运行时界面残留英文：${phrase}`);

console.log('ui-language-tests: static UI is Chinese-only and decorative microcopy has been removed');
