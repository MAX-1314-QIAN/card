# 《人格牌》项目开发规则

## 规则权威优先级

1. 最新策划明确确认。
2. 当前目标数值设计。
3. 当前开发规格 V2.1。
4. 历史实现与旧文档。

## V2.1 定位

- V2.1 是当前网页 Demo 的实现基线和迁移前行为基线。
- V2.1 不是未来正式玩法的最高设计权威。
- 当前目标数值母表和最新策划确认代表未来目标方向。
- 不得把未来目标数值直接写入当前运行版本，除非对应迁移阶段已经获得策划确认。

## 冲突处理

当当前实现与目标设计冲突时：

1. 保留当前实现作为迁移前基线。
2. 明确记录冲突及受影响系统。
3. 按目标版本制定分阶段迁移方案。
4. 不得为了兼容旧代码而强行保留错误结构。
5. 未确认内容统一标记为 `UNDECIDED`，不得自行补规则。

## 迁移与数据规则

- 配置迁移、流程迁移、存档迁移必须分阶段进行。
- 不允许同时维护两份相同的策划数值；兼容文件只能作为 adapter 或 re-export。
- 所有长期存档结构变更必须提供版本迁移方案或明确失效策略。
- 每个迁移阶段必须保留迁移前自动测试，并新增目标结构测试。
- 修改前检查已有内容，不删除来源不明的资源，不顺手扩大本阶段范围。

## AI 边界

- AI 不得直接生成未经本地规则验证的战斗数值、可执行规则、随机结果或胜负结果。
- AI 输出只能作为受约束的表现内容或合法配置候选，最终结果必须由本地规则校验。
- 客户端不得保存生产环境 API Key。

## Phase A 当前约束

- 当前启用的 Run Template 必须保持 `RUN_TEMPLATE_CURRENT_DEMO`。
- 当前三战 Demo 的数值、流程、商店、路线、报告、D20、Boss、介入事件和存档体验不得改变。
- `RUN_TEMPLATE_TARGET` 只允许作为保留 ID，不得在 Phase A 启用或填入目标 13 节点。

## Phase B 当前约束

- 当前流程身份由 `runTemplateId + currentNodeId` 决定，`battleIndex` 仅是现有三战 UI、旧公式、行为报告和旧存档的兼容派生值。
- `RUN_TEMPLATE_CURRENT_DEMO` 必须由通用 Run Controller 和 Stage Node 的声明式 `transitions` 驱动。
- Battle、Route、Report、Forge 只能提交本节点结果，不得自行决定全局下一节点。
- 活动局存档版本为 V2；旧 V1 存档必须按 `phase + battleIndex` 迁移，无法安全判断时必须失效，禁止猜测。
- 节点首次进入与存档恢复必须分离；已生成的 Boss、介入事件、路线、随机事件和铸造候选不得在恢复时重抽。
- Phase B 仍不得启用 `RUN_TEMPLATE_TARGET`，不得接入目标 13 节点或未来人格、品质、行为标签、收藏与融合系统。

## Phase B.5 Persona Runtime D-lite 约束

- `RUN_TEMPLATE_CURRENT_DEMO` 仍是默认正式模板；`RUN_TEMPLATE_PERSONA_SLICE` 仅允许显式开发调用，不得加入正式主界面入口。
- 新 Persona Runtime 的唯一权威状态位于 Run State：`personaInstancesById`、`runPersonaPool`、`equippedPersonaInstanceIds`、`personaHistory`。
- Persona Growth Node 的 Node Runtime 只能保存已生成的 `instanceId`，不得复制完整人格对象。
- Persona 配置必须使用声明式 `conditions / effects / growthRules`，禁止在配置中写函数。
- Preview 不得修改人格状态；只有正式 Commit 可以增加成长、连续计数、激活次数或消费蓄力状态。
- 当前八张基础人格继续通过旧入口运行，Phase B.5 不得改变其数值与正式三战体验；后续正式迁移必须逐张接入统一 Runtime，不能长期保留两套系统。
- 本阶段不得扩展到完整 AI 人格、品质概率、行为标签、13 节点、库存、融合或长期收藏。

## Phase B.75 正式基础人格统一迁移约束

- `balance/base-personas.js` 是八张正式基础人格的唯一声明式数据源；`balance/persona-templates.js` 只负责汇总注册，不得复制 trigger/effect/value。
- 正式三战与 `RUN_TEMPLATE_PERSONA_SLICE` 必须统一通过 `PersonaRuntime` 执行；`game.js` 不得恢复旧人格触发、名称特判或独立数值结算循环。
- 正式基础人格必须以 `BASE_INSTANCE_<personaId>` 创建，来源为 `BASE_PERSONA`；四槽顺序与 Boss 的 `disabledSlotIndexes` 均由 Runtime 处理。
- 断舍离者的 `charged` 属于 BATTLE scope：弃牌 Commit 建立、出牌 Preview 不消费、出牌 Commit 消费、跨存档恢复、切换战斗清除。
- D20 生成人格可经 `LegacyPersonaAdapter` 转成动态声明式模板，但正式战斗仍只能由 Runtime 结算；完美回响使用通用 `FIRST_SUCCESSFUL_TRIGGER_THIS_BATTLE + REPEAT_EFFECT_ONCE` 机制。
- Legacy Adapter 只负责旧数据/旧存档转换，不得承担战斗结算。
- `RUN_TEMPLATE_CURRENT_DEMO` 仍是正式默认模板；不得启用 `RUN_TEMPLATE_TARGET`，不得进入 Phase C/D/E 范围。
