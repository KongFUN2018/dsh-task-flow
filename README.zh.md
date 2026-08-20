# `@kongfun2018/dsh-task-flow`

[English](README.md) | 中文

Task Flow Recipe Engine —— 面向 DeepSeek Harness（DSH）的目标驱动、多阶段任务编排层，以**单个独立插件包**发布。它把 DSH 的一次普通单会话操作升级为按 Recipe 调度的流水线式任务执行：任务沿定义好的阶段序列推进，每一阶段派发给专用 agent 会话，由带 A/B/C 分级质量闸（Gate）把关，并提供 rewind / 预算 / 审查策略等回流纠偏手段，以及一个浏览器工作台用于查看与操作。

这是一个独立仓库（不属于 DeepSeek Harness monorepo）。它针对已发布的 `@deepseek-ai/*` 运行时包自行构建、测试与发布，host 半区与浏览器半区都折叠进这一个 npm 包 —— 即 task-flow 版的 `@deepseek-ai/dsh-llm-fallback`。

## 功能

本包把整套 task-flow 领域模型折叠成一个 host 子系统加一个浏览器半区：

- **Recipe 驱动的执行** —— `Task` 引用不可变的 `RecipeRevision`；每个 `Recipe` 声明一组有序的 `Phase` 与 `Gate`。引擎（`recipe-engine-core` + `recipe-multiphase`）把每个阶段调度到专用 agent 会话，驱动「提交 → 门检 → 下一阶段」链路，并通过重验 journal 头在重启后恢复（已通过的 Gate 绝不重跑）。
- **A/B/C 分级质量闸** —— 每个 Gate 运行一组 `GateCheck`。机器强制（A）类由引擎直接判定；人工确认（B）与人工仲裁（C）类不自动判分，而是作为持久化的 attention 项浮现在工作台审批中心。所有检查通过才推进。
- **持久澄清（而非即时问答）** —— 对缺失的必答条件创建持久澄清请求，可通过向阶段会话注入一条用户消息来满足。
- **rewind / 预算 / 审查策略** —— rewind 预览并分支出一个 superseded 的重跑；budget 维护 provision/append/usage 三维台账，带 80% 预警与硬上限决策点；review-policy 提供 strict/balanced/trusted 三档，带补签完成守卫与熔断恢复。
- **带版本与影响的产物** —— 不可变的分版产物、跨消费阶段的依赖闭包、stale 传播与编辑锁租约。
- **双创建入口** —— 工作台「新建」向导（入口 A）与会话内一句话生成确认卡片（入口 B），两者最终都落成真实 `Task` 并播种进空的首阶段会话。
- **指标与汇总** —— 面向工作台面板的 journal 派生只读投影。

## 安装与构建

要求：Node ≥ 24 与 pnpm（`@deepseek-ai` 的 peer 树对 pnpm 友好；`npm` 的 arborist 历史上对 `rc.*` 混合 peer 范围会崩溃）。

```bash
pnpm install --frozen-lockfile
pnpm run build   # tsc 产出 lib/types/*.js + .d.ts，再由 tsdown 打包出 lib/index.js + lib/client.js
pnpm test        # vitest 覆盖折叠后的 host + client 测试套件
```

运行时 peer 依赖为已发布的 DeepSeek Harness 包（统一钉 `^0.1.0-rc.6`，外加 `@deepseek-ai/cordis`），你需要把它们与本包一起装进部署树。

### host 半区 —— 在 `cordis.yml` / `cordis.patch.yml` 中装配

加一条 loader 条目即可。根导出是一个统一 Cordis 插件（`name = 'dsh-task-flow-host'`），按正确的拓扑顺序注册所有折叠域：

```yaml
# 在 DSH profile 的 cordis.patch.yml（或任意组合的 cordis.yml）中
- insert:
    - id: task-flow
      name: '@kongfun2018/dsh-task-flow'
```

这会挂载整个 host 子系统，并暴露 `ctx.remote.*` 下的八个可路由命名空间：`tasks`、`recipes`、`workbenchHost`、`workbenchHostStream`、`deliverables`、`digest`、`metrics`、`rewind`。host 需要普通 DSH web profile 中已有的标准 base-bundle 服务（`storageDomain`、`sessions`、`agents`、`goals`、`tools`）。

### 浏览器半区 —— 自动加载

本包声明了一个 `dsh.client` 浏览器贡献（platform `web`）。只要节点端被加载，DSH web 外壳就会自动加载 `lib/client.js` 并注入 boot manifest，无需额外接线。它自行挂载八个 task-flow Remote 命名空间，并激活九个折叠的 client 特征域。

## 浏览器工作台（浏览器半区）

浏览器半区在官方 DSH web 外壳内渲染整套任务流程操作台，只使用官方 seat + 随包携带的 TS 模块增强：

- 官方 `shell.overlay` seat 上的右侧**非模态抽屉**面板 —— 标签页含看板 / 任务列表 / Recipe 库 / 审批中心 / 澄清队列 / 新建 / 详情。
- **「任务流程」触发器按钮** —— 注册进官方 `sidebar.footer.action` seat，因此在原生官方 DSH web release 上即可工作，无需改官方外壳。
- **审批中心**把持久化的 attention 项（B/C 门检决策、澄清、恢复）从 `workbenchHost` + `workbenchHostStream` 投影出来，带冲突检测且无静默确认。
- **任务详情 / 任务列表 / 看板 / 新建向导**读 `tasks`、`recipes`、`metrics`、`digest`、`deliverables`、`rewind`。

## Remote / 浏览器命名空间

浏览器半区通过八个子路径导出的 Remote 描述符访问 host，类型由浏览器安全的 `/remote/*` 边界类型提供（读取持久状态无需加载运行时）：

- `./remote/task` —— `ctx.remote.tasks`（任务生命周期、提交、阶段运行、门检结果）
- `./remote/recipe` —— `ctx.remote.recipes`
- `./remote/workbench` —— `ctx.remote.workbenchHost`（快照、批量确认、决策解决）
- `./remote/workbenchHostStream` —— `ctx.remote.workbenchHostStream`（journal 派生的增量投影）
- `./remote/deliverables` —— `ctx.remote.deliverables`
- `./remote/digest` —— `ctx.remote.digest`
- `./remote/metrics` —— `ctx.remote.metrics`
- `./remote/rewind` —— `ctx.remote.rewind`

## License

MIT，见 [LICENSE](LICENSE)。Copyright (c) 2026 KongFUN2018。

## 已知限制与待办

- **预算类校准待定** —— 80% 预警与硬上限阈值用的是示范值；正式校准需先有真实任务跑通 M2/M3 流程积累台账（`recordUsage` 是显式口、无自动采集）。
- **npm 发布延后** —— 目前本包通过直接安装本仓库（或本地 tarball）到 DSH profile 来交付；`registry` 发布路径与「官方内置」消费路线属后续目标。
