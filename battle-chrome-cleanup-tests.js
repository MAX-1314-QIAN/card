const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "battle-chrome-cleanup.css"), "utf8");
const battleStart = html.indexOf('<main id="battle-screen"');
const battleEnd = html.indexOf('</main>', battleStart);
const battle = html.slice(battleStart, battleEnd);

assert.match(html, /battle-chrome-cleanup\.css\?v=20260827-icon-only-v1/);
assert.ok(!battle.includes("人格总加成"));
assert.ok(!battle.includes("基础分加成"));
assert.ok(!battle.includes("倍率加成"));
assert.ok(!battle.includes(">牌型规则<"));
assert.ok(!battle.includes(">牌堆<"));
assert.match(battle, /id="open-hand-rules"[^>]*aria-label="牌型规则"/);
assert.match(battle, /id="persona-chip"/);
assert.match(battle, /id="persona-mult"/);
assert.match(battle, /id="deck-count"/);
assert.match(battle, /id="used-count"/);
assert.match(css, /\.battle-runtime-values\[hidden\][\s\S]*?display:none!important/);
assert.ok(battle.includes('class="battle-utility-bar"'));
assert.ok(battle.includes('assets/art/battle-tools/hand-rules-icon-v3.png'));
assert.ok(battle.includes('assets/art/battle-tools/deck-icon-v3.png'));

console.log("battle chrome cleanup tests passed");
