# AI 人格选择 Worker

该 Worker 是网页客户端与 DeepSeek 之间的唯一公网边界。DeepSeek 只能从客户端已经本地验证过的候选 ID 中选择，不能创建战斗规则或数值。

## 本地准备

1. 复制 `.dev.vars.example` 为 `.dev.vars`。
2. 只在 `.dev.vars` 中填写 `DEEPSEEK_API_KEY`，不要提交该文件。
3. 执行 `npm install`。
4. 执行 `npm run dev`，默认接口为 `http://localhost:8787/api/ai-persona/select`。

## 部署

1. 执行 `npx wrangler login` 并在浏览器授权 Cloudflare。
2. 执行 `npx wrangler secret put DEEPSEEK_API_KEY`，在隐藏输入中粘贴 Key。
3. 确认 `wrangler.jsonc` 的 `ALLOWED_ORIGINS` 同时包含本地联调来源和正式游戏来源；当前正式 GitHub Pages 来源为 `https://max-1314-qian.github.io`，只填写 origin，不附带 `/card/` 路径。
4. 执行 `npm run deploy`。
5. 将得到的完整接口地址填入 `game/ai-persona-api-config.js` 的 `endpoint`。

如果本机无法完成 Wrangler 安装，可以执行 `node scripts/build-dashboard-worker.mjs`，然后把生成的 `dist/worker.js` 全部复制到 Cloudflare 的 Edit Code 编辑器并部署。该文件由两个源文件自动生成，不单独维护。

正式环境不要允许 `file://` 的 `null` Origin。网页应通过 HTTP/HTTPS 运行。

Worker 对 DeepSeek 的单次等待上限为 5.5 秒；超时返回 `MODEL_TIMEOUT`，网页端随后使用已经过本地校验的第一候选，不阻断关卡流程。
