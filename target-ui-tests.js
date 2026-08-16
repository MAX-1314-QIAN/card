const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),shell=fs.readFileSync('shell.js','utf8'),game=fs.readFileSync('game.js','utf8');
for(const id of ['start-target-run','target-loadout-dialog','target-loadout-options','target-loadout-slots','target-loadout-confirm','persona-growth-keep','target-report-dialog','target-report-continue','target-carry-dialog','target-carry-confirm'])assert.ok(html.includes(`id="${id}"`),`missing target UI: ${id}`);
assert.ok(shell.includes("querySelector('#start-target-run').onclick"),'target run must have a visible development entry');assert.ok(game.includes("window.startTargetRun=()=>"));assert.ok(game.includes("startRun('RUN_TEMPLATE_TARGET')"));assert.ok(!shell.match(/startRun\('RUN_TEMPLATE_TARGET'\).*#start-game/),'default start must not be switched to target');assert.ok(html.includes('target-run.css'));
console.log('target-ui-tests: visible dev entry, loadout, growth keep, report, carry-out and isolated default entry passed');
