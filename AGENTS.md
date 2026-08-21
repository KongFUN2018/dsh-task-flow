# dsh-task-flow 项目级指令（Project AGENTS.md）

> 由 DSH / pi 在进入本仓库时注入。这里是本项目的开发约定与全局规则的落点。

## 通用搜索约定（Global rule，继承自用户全局）

- 任何需要在命令行/脚本中搜索代码或文本的场景，一律使用 **ripgrep**（命令：`rg`），禁止使用原始 `grep`（包括 `grep -r`、`grep -i -n` 等）。
- 代码库正则检索优先用 ripgrep；Serena（`serena_search_pattern` / `serena_find_symbol`）用于语义/符号级检索，按各自用途保留。
- 常见等价写法（grep → rg）：`grep -r "x" .` → `rg "x"`；`grep -i "x"` → `rg -i "x"`；`grep -rn "x" dir` → `rg -n "x" dir`；`grep -l "x"` → `rg -l "x"`；`grep -c "x"` → `rg -c "x"`；`grep -v "x"` → `rg -v "x"`；`grep "x" *.ts` → `rg "x" -g "*.ts"`。
- 理由：ripgrep 更快（Rust）、默认递归、默认尊重 `.gitignore`、UTF-8 友好、语法更简洁。

## 开发工具规则（本项目）

本项目的后续编码与开发工作，优先借助以下两个服务来提升效率与准确率：

1. **Serena（`serena_find_symbol` / `serena_get_symbols_overview` / `serena_find_referencing_symbols` / `serena_search_pattern`）**
   - 基于 LSP 的语义检索 / 符号定位 / 引用分析，用于理解与导航本项目代码。
2. **Context7（`resolve-library-id` / `query-docs`）**
   - 获取第三方库、框架、SDK 的最新官方文档与代码示例，避免依赖过时的训练数据；涉及库的 API、配置、版本迁移、调试时优先调用。

## 构建与测试

- `tsc -p tsconfig.json`（产出 `lib/types`）→ `tsdown`（打包 `lib/*`）→ `vitest run`。
- 本项目目录约定：`src/`（源码）、`lib/`（构建产物）、`remote/`（typert 远端描述符，生成物）、`tests/`（vitest 测试）、`.serena/`（Serena 项目记忆）。

## 后续迭代需求（待办看板）

- **流程预览支持分支 DAG**：当前 Recipe 数据模型为线性 phases 串行（复杂度体现在每阶段的 A/B/C 门与阶段 kind 上）。已按用户确认先做「线性流程+门精致可视化」；「真正的条件分支/流程跳转（DAG）」作为后续版本迭代优化项，需扩展数据模型（涉 M1 冻结契约），暂不在 UI 层硬做。

## 已完成迭代（迭代记录）

### 新建向导「3 · 目标与配置」升级（commit `a5ecc1f`）

用户反馈后做的三件套：

1. **任务目标 → 多行 textarea**：`.goalInput`（min-height 88px），支持详细目标文本。
2. **Workspace 可选已有 / 可输新增**：原生 `<input list>` + `<datalist>` combobox；候选来自 `controller.loadWorkspaces()`（`tasks.listTasks()` 去重非空 `workspaceId`，恒置 `'default'` 前置）。修复了「无法选已有/建新 workspace」缺陷。
3. **AI 优化目标按钮（用户手动触发，绝不自动）**：
   - 前端：`.goalCombo` 内右对齐按钮，`polishing` 状态防重复点；失败静默保留用户草稿。
   - 后端：新增 `src/task-polish/index.ts` —— `TaskPolishService`（`@Remote('polish')`），`ctx.llm` 现有路由自动选首个 provider + 其首个 model，流式累积文本。

**关键实现决策（维护时留意）**
- `@Remote('polish')` 由 typert Gate 的 **source-mode discovery** 在运行时注册 `taskPolish` namespace，**不需要**手动伪造 `remote/taskPolish.js` 生成物（那只是 npm 发布子路径，generator 在 harness monorepo 内）→ 未加 `./remote/taskPolish` package.json 导出，运行特性不依赖它。
- 自定义 hooks 命名**必须避让 slots 渲染器保留标准 hook**：`useWorkspaces` 是标准 hook（类型固定 `WorkspaceListState`），所以自定义候选源用 `createWorkspaces` → `useCreateWorkspaces`。若将来再用 workspace 列表源，别重蹈覆辙。
- 外层 plugin `inject` 增加 `llm`；`TaskPolishService` 自身 `static inject = ['llm']`。测试里 `plugin.spec.ts` 的 `bootHost` 提供最小 llm stub（断言 namespace 激活/方法存在，不真调用 LLM）。

