const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const css = fs.readFileSync(path.join(root, "battle-action-buttons.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /battle-action-buttons\.css\?v=20260831-battle-actions-original-v1/);
assert.match(html, /<footer class="battle-actions">/);
assert.match(html, /id="play-btn" class="battle-action-button"/);
assert.match(html, /id="discard-btn" class="battle-action-button"/);
assert.ok(html.indexOf('id="discard-btn"') < html.indexOf('id="play-btn"'), "弃牌按钮应位于左侧，出牌按钮应位于右侧");
assert.ok(!html.includes('id="play-btn" class="action play"'));
assert.ok(!html.includes('id="discard-btn" class="action discard"'));
assert.match(html, /id="play-btn"[\s\S]*?play-icon-v1\.png[\s\S]*?<span>出牌<\/span>/);
assert.match(html, /id="discard-btn"[\s\S]*?discard-icon-v1\.png[\s\S]*?<span>弃牌<\/span>/);
assert.match(html, /id="play-btn"[^>]*aria-label="出牌，快捷键空格键"/);
assert.match(html, /id="discard-btn"[^>]*aria-label="弃牌，快捷键 D"/);

const assets = [
  ["play-button-v1.png", "--battle-play-button", "#play-btn"],
  ["discard-button-v1.png", "--battle-discard-button", "#discard-btn"],
];

for (const [file, variable, selector] of assets) {
  assert.ok(fs.existsSync(path.join(root, "assets", "art", "battle-actions", file)), `${file} should exist`);
  assert.ok(css.includes(`${variable}:url("assets/art/battle-actions/${file}")`));
  assert.ok(css.includes(selector));
  assert.ok(css.includes(`var(${variable})`));
}

for (const icon of ["play-icon-v1.png", "discard-icon-v1.png"]) {
  assert.ok(fs.existsSync(path.join(root, "assets", "art", "battle-actions", icon)), `${icon} should exist`);
}

assert.match(css, /\.battle-action-button\{[\s\S]*?clip-path:none/);
assert.match(css, /\.battle-action-button\{[\s\S]*?animation:none/);
assert.match(css, /\.battle-action-button img\{[\s\S]*?object-fit:contain/);
assert.match(css, /\.battle-action-button span\{[\s\S]*?font-size:22px/);
assert.match(css, /\.battle-action-button:disabled\{[\s\S]*?cursor:not-allowed/);

console.log("battle action button tests passed");
