/**
 * The M0-frozen recipe (calibration report §6): four phases, nine gate
 * checks (8 adopted + 1 adjusted-adopted), calibrated defaults, auto P4
 * mode. Test-only fixture proving the registry schema carries the frozen
 * structure; it is not the shipped default.
 */

import type { RecipePayload } from '../../src/recipe/types.ts'

export const FROZEN_RECIPE: RecipePayload = {
  phases: [
    {
      phaseId: 'P1-material-survey',
      kind: 'material-survey',
      goal: '素材理解：清点材料、判定可读性、归纳角色、列约束与未决',
      inputs: ['全部输入材料'],
      outputs: ['素材清单（角色/锚点/可读性）', '约束与未决项'],
      submissionCriteria: ['引用存在且执行者可读；不可读材料显式路由，不静默跳过'],
    },
    {
      phaseId: 'P2-requirement-map',
      kind: 'requirement-map',
      goal: '需求梳理：要点锚点化、交叉一致性核对、生成分级澄清问题',
      inputs: ['P1 输出'],
      outputs: ['要点矩阵（逐条锚点）', '一致性发现', '澄清清单（必答/可默认）'],
      submissionCriteria: ['全部要点可追溯；材料间矛盾已标注；归纳与对应关系合并为一次批量 B 确认'],
    },
    {
      phaseId: 'P3-clarify',
      kind: 'clarify',
      goal: '澄清确认：批量问答与回填',
      inputs: ['P2 澄清清单'],
      outputs: ['问题-结论对'],
      submissionCriteria: ['必答全部有结论（拦定稿不拦起草）；方向性决策经用户'],
    },
    {
      phaseId: 'P4-solution',
      kind: 'solution',
      goal: '方案/规格：按材料完备度三态执行（起草/骨架/校验归一）',
      inputs: ['要点', '结论'],
      outputs: ['交付物', '决策登记表（编号/关联问题/状态/默认假设）'],
      submissionCriteria: ['与材料一致性机器核对通过；全部未决决策显式登记，无一静默'],
    },
  ],
  gateChecks: [
    { checkId: 'p1-material-readable', phaseId: 'P1-material-survey', kind: 'A', machineScope: ['引用存在、可读性'], humanAction: ['不可读材料转人工描述或多模态'], circuitBreaker: '连续 2 份不可读→暂停升级' },
    { checkId: 'p2-points-traceable', phaseId: 'P2-requirement-map', kind: 'A', machineScope: ['追溯链存在'], humanAction: [], circuitBreaker: '缺锚点要点 >10%→打回' },
    { checkId: 'p2-cross-consistency', phaseId: 'P2-requirement-map', kind: 'A', machineScope: ['一致性核对'], humanAction: ['矛盾裁决需维护者时转 B'], circuitBreaker: '≥3 处矛盾→要求材料整理轮' },
    { checkId: 'p2-batch-confirm', phaseId: 'P2-requirement-map', kind: 'B', machineScope: ['对应关系'], humanAction: ['用户批量确认或修改'], circuitBreaker: '连续 2 任务全选不改→降为抽查' },
    { checkId: 'p3-must-answer-complete', phaseId: 'P3-clarify', kind: 'A', machineScope: ['判据覆盖'], humanAction: ['用户批量回答'] },
    { checkId: 'p3-intent-direction', phaseId: 'P3-clarify', kind: 'C', machineScope: ['意图对齐'], humanAction: ['用户拍板'] },
    { checkId: 'p4-consistency-machine', phaseId: 'P4-solution', kind: 'A', machineScope: ['字面一致性'], humanAction: ['矛盾拦下待材料维护者确认'] },
    { checkId: 'p4-coverage-criteria', phaseId: 'P4-solution', kind: 'B', machineScope: ['覆盖度'], humanAction: ['用户确认精化后判据'] },
    { checkId: 'p4-decision-registry', phaseId: 'P4-solution', kind: 'A', machineScope: ['登记完整性'], humanAction: [], circuitBreaker: '静默假设 ≥1→打回' },
  ],
  defaults: {
    batchConfirm: 'per-phase-single',
    clarify: { maxRounds: 2, splitMustDefault: true },
    draftPolicy: 'block-finalize-not-draft',
  },
  p4Mode: { mode: 'auto' },
}
