# 《人格牌》网页 Demo 代码结构

## 目标

本项目采用“配置、领域运行时、表现转换、页面编排”四层结构。修改数值、规则、界面或流程时，应只进入对应层，避免继续把逻辑堆入 `game.js`。

## 依赖方向

```text
balance/*（纯配置）
        ↓
persona/*、shop/*、battle/*（领域运行时）
        ↓
game/*（纯表现与分析转换）
        ↓
game.js（页面状态与流程编排）
        ↓
index.html / CSS（页面装配与视觉）
```

依赖只能向下。配置不得读取 DOM，领域运行时不得操作弹窗，表现模块不得修改存档或战斗状态。

## 当前模块职责

### 配置层

- `balance/`：关卡、牌型、人格、商店、限制规则等唯一策划数据源。
- 配置只能保存声明式数据，不得包含函数。
- 相同数值不得在多个配置文件中复制；兼容入口只能转发或适配。

### 领域运行时

- `run-controller.js`：节点进入、完成、转换、节点运行数据和整局状态。
- `persona/persona-runtime.js`：人格实例、装备槽、触发、成长和副属性。
- `shop/shop-runtime.js`：商品抽取、价格、卡牌与构筑强化。
- `stage-limit-runtime.js`：关卡限制的抽取和战斗修正。
- `battle/score-runtime.js`：一手牌的完整计分管线。它接收明确上下文并返回结算结果，不操作 DOM。
- `save-system.js`：存档外壳、校验与恢复入口。

### 表现与分析层

- `game/ui-formatters.js`：HTML 转义与统一数值格式。
- `game/persona-presentation.js`：人格触发、效果、商店和战斗文案的表现模型。
- `game/card-presentation.js`：扑克牌美术映射与牌面 HTML。
- `game/build-inspection.js`：牌型强化、花色强化的查看数据与 HTML。
- `game/behavior-analytics.js`：玩家行为聚合与报告计算。后续 AI 玩家画像从这里继续扩展。

这些模块应保持纯净：不读取 DOM、不访问本地存储、不发送网络请求、不直接调用 `runController`。

### 页面编排层

- `game.js`：保存当前页面的临时状态，调用领域运行时，处理按钮事件和弹窗切换。
- 它可以协调多个模块，但不再拥有计分公式、行为指标公式、牌面模板或人格文案规则。
- 新功能如果包含可单独测试的规则，必须先建立独立模块，再由 `game.js` 接入。

## 常见修改应该去哪里

| 修改内容 | 首选位置 |
| --- | --- |
| 调整关卡、目标分、商品或人格数值 | `balance/` |
| 增加人格触发条件或效果执行器 | `persona/` |
| 修改一手牌如何计分 | `battle/score-runtime.js` |
| 修改商品如何定价或应用 | `shop/shop-runtime.js` |
| 修改玩家行为指标 | `game/behavior-analytics.js` |
| 修改人格规则如何写给玩家看 | `game/persona-presentation.js` |
| 修改卡牌 HTML 或美术映射 | `game/card-presentation.js`、`card-art-manifest.js` |
| 修改弹窗、按钮和页面跳转 | `game.js`、`shell.js` |
| 修改视觉尺寸、颜色和动效 | 对应 CSS 文件 |

## AI 人格 V1 的预留边界

AI 人格不能直接写进 `game.js`。下一阶段应建立独立目录，并保持以下职责：

```text
persona/ai/behavior-snapshot.js   玩家行为统一快照
persona/ai/rule-parts.js          合法规则零件白名单
persona/ai/value-budget.js        数值价值锚定
persona/ai/candidate-builder.js   本地候选组合
persona/ai/candidate-validator.js 合法性、可触发性与冲突校验
persona/ai/similarity.js          与现有人格查重
persona/ai/generator.js           生成流程编排与备用结果
```

未来联网模型只允许在这些模块给出的合法 ID 中选择。网络层不能直接修改战斗、存档或人格实例。

## 重构纪律

1. 每次只移动一个清晰职责，先保留原函数入口，再替换内部实现。
2. 重构提交不得顺便调整数值或玩家体验。
3. 每个新模块必须有直接单元测试，并继续通过整局回归测试。
4. 存档结构变化必须单独提交，并提供版本迁移或明确失效策略。
5. 不能确定的策划规则继续标记 `UNDECIDED`，不得由代码自行补全。
