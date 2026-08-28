const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const css = fs.readFileSync(path.join(root, "main-menu-buttons.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /main-menu-buttons\.css\?v=20260827-isolated-component-v1/);
assert.match(html, /<nav class="main-menu-actions">/);
assert.ok(!html.includes('class="menu-actions"'), "main menu should not opt into legacy button rules");
assert.ok(!html.includes('class="menu-primary"'), "start should not opt into legacy pulse animation");

const menuButtons = [
  ["start-game-v2.png", "--main-menu-start", "#start-game"],
  ["persona-gallery-v2.png", "--main-menu-gallery", "#open-gallery"],
  ["settings-v2.png", "--main-menu-settings", "#open-settings"],
];

for (const [file, variable, selector] of menuButtons) {
  assert.ok(fs.existsSync(path.join(root, "assets", "art", "main-menu", file)), `${file} should exist`);
  assert.ok(css.includes(`${variable}:url("assets/art/main-menu/${file}")`), `${variable} should map ${file}`);
  assert.ok(css.includes(selector), `${selector} should be configured by the isolated component`);
}

assert.match(css, /#start-game,\s*\n#main-menu \.main-menu-actions #continue-game\{background-image:var\(--main-menu-start\)\}/);
assert.ok(!css.includes("--main-menu-continue"), "continue should reuse start art");
assert.ok(!fs.existsSync(path.join(root, "assets", "art", "main-menu", "continue-game.png")));
assert.ok(!fs.existsSync(path.join(root, "assets", "art", "main-menu", "continue-game-v2.png")));
assert.match(css, /\.main-menu-actions button\{[\s\S]*?animation:none/);

console.log("main menu button component tests passed");
