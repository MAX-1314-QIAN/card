import{mkdir,readFile,writeFile}from'node:fs/promises';
import{dirname,resolve}from'node:path';
import{fileURLToPath}from'node:url';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const selection=(await readFile(resolve(projectRoot,'src/selection.js'),'utf8')).replace(/^export /gm,'');
const entry=(await readFile(resolve(projectRoot,'src/index.js'),'utf8')).replace(/^import\{[^\n]+\}from'\.\/selection\.js';\s*/,'');
const output=`// Generated from src/selection.js + src/index.js. Do not edit this generated copy.\n${selection}\n${entry}`;
await mkdir(resolve(projectRoot,'dist'),{recursive:true});
await writeFile(resolve(projectRoot,'dist/worker.js'),output,'utf8');
console.log('Built dist/worker.js for the Cloudflare dashboard editor.');
