const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),script=fs.readFileSync('tutorial.js','utf8'),css=fs.readFileSync('tutorial.css','utf8'),game=fs.readFileSync('game.js','utf8');

for(const id of ['tutorial-overlay','tutorial-step-label','tutorial-title','tutorial-copy','tutorial-skip','tutorial-prev','tutorial-next','replay-tutorial'])assert.ok(html.includes(`id="${id}"`),`missing ${id}`);
for(const target of ["'.run-score'","'.hand-zone'","'.score-preview'","'.persona-rail'","'.protocol'"])assert.ok(script.includes(target),`missing tutorial target ${target}`);
assert.ok(script.includes("localStorage.getItem(KEY)==='1'"),'tutorial completion is not persistent');
assert.ok(script.includes("event.stopImmediatePropagation()"),'tutorial keyboard input can leak into battle');
assert.ok(css.includes('.tutorial-focus')&&css.includes('9999px'),'tutorial focus mask missing');
assert.ok(game.includes('window.maybeOpenBattleTutorial?.()'),'tutorial is not started after opening deal');
console.log('tutorial-tests: 5 steps, persistence, controls, focus mask and battle hook passed');
