const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const css = fs.readFileSync(path.join(root, "battle-background.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /battle-background\.css\?v=20260827-battle-scene-v1/);
assert.match(css, /#battle-screen\.game-frame\{[\s\S]*?var\(--background-battle\)/);
assert.match(css, /background-position:center 46%/);
assert.match(css, /#battle-screen \.battle-stage:after\{\s*display:none/);
assert.match(css, /#battle-screen \.battle-stage:before\{[\s\S]*?clip-path:none/);
assert.match(css, /#battle-screen>\.persona-rail,[\s\S]*?#battle-screen>\.boss-rail\{[\s\S]*?backdrop-filter:blur\(2px\)/);

console.log("battle background composition tests passed");
