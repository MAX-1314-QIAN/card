const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const css = fs.readFileSync(path.join(root, "background-art.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const backgrounds = [
  ["image080.png", "--background-main-menu", "#main-menu.main-menu"],
  ["image081.png", "--background-settings", "#settings-screen.settings-screen"],
  ["image082.png", "--background-battle", "#battle-screen.game-frame"],
  ["image086.png", "--background-shop", "dialog#shop-dialog.shop-dialog"],
];

assert.match(html, /background-art\.css\?v=20260827-page-backgrounds-v2/);
assert.ok(!html.includes('class="title-cards"'), "main menu decorative card pile should be removed");

for (const [file, variable, selector] of backgrounds) {
  assert.ok(fs.existsSync(path.join(root, "assets", "art", "backgrounds", file)), `${file} should exist`);
  assert.ok(css.includes(`${variable}:url("assets/art/backgrounds/${file}")`), `${variable} should map ${file}`);
  assert.ok(css.includes(selector), `${selector} should own a page-specific background`);
  assert.ok(css.includes(`var(${variable})`), `${selector} should consume ${variable}`);
}


console.log("background art tests passed");
