const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const css = fs.readFileSync(path.join(root, "battle-action-buttons.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /battle-action-buttons\.css\?v=20260829-battle-actions-v3/);
assert.match(html, /<footer class="battle-actions">/);
assert.match(html, /id="play-btn" class="battle-action-button"/);
assert.match(html, /id="discard-btn" class="battle-action-button"/);
assert.ok(html.indexOf('id="discard-btn"') < html.indexOf('id="play-btn"'), "弃牌按钮应位于左侧，出牌按钮应位于右侧");
assert.ok(!html.includes('id="play-btn" class="action play"'));
assert.ok(!html.includes('id="discard-btn" class="action discard"'));
assert.match(html, /id="play-btn"[\s\S]*?play-label-v2\.png/);
assert.match(html, /id="discard-btn"[\s\S]*?discard-label-v2\.png/);
assert.match(html, /id="play-btn"[^>]*aria-label="出牌，快捷键空格键"/);
assert.match(html, /id="discard-btn"[^>]*aria-label="弃牌，快捷键 D"/);

const assets = [
  ["play-button-v2.png", "--battle-play-button", "#play-btn"],
  ["discard-button-v2.png", "--battle-discard-button", "#discard-btn"],
];

for (const [file, variable, selector] of assets) {
  assert.ok(fs.existsSync(path.join(root, "assets", "art", "battle-actions", file)), `${file} should exist`);
  assert.ok(css.includes(`${variable}:url("assets/art/battle-actions/${file}")`));
  assert.ok(css.includes(selector));
  assert.ok(css.includes(`var(${variable})`));
}

for (const label of ["play-label-v2.png", "discard-label-v2.png"]) {
  assert.ok(fs.existsSync(path.join(root, "assets", "art", "battle-actions", label)), `${label} should exist`);
}

assert.match(css, /\.battle-action-button\{[\s\S]*?clip-path:none/);
assert.match(css, /\.battle-action-button\{[\s\S]*?animation:none/);
assert.match(css, /\.battle-action-button \.battle-action-label\{[\s\S]*?object-fit:contain/);
assert.match(css, /\.battle-action-button:disabled\{[\s\S]*?cursor:not-allowed/);

console.log("battle action button tests passed");
