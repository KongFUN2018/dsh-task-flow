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
