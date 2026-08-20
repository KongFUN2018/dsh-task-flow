/**
 * Built-in validation-scenario templates: a small seed set of processing
 * templates registered alongside the empty template so the workbench starts
 * with real, pickable scenarios (需求研发 / 代码审查 / Bug 修复). Each pairs
 * multi-phase steps with representative A/B/C gate checks.
 */
/** 需求研发: collect -> analyze -> PRD, A/B/C gates. */
export const REQUIREMENT_RECIPE_ID = 'requirement';
export const REQUIREMENT_TEMPLATE = {
    phases: [
        { phaseId: 'collect', kind: 'default', goal: '收集并整理原始需求与上下文材料。', inputs: [], outputs: ['需求材料清单'], submissionCriteria: ['材料清单列明来源与缺失项'] },
        { phaseId: 'analyze', kind: 'default', goal: '分析影响面、约束与验收口径。', inputs: ['需求材料清单'], outputs: ['分析结论'], submissionCriteria: ['影响面与约束成文'] },
        { phaseId: 'write-prd', kind: 'default', goal: '产出 PRD 草稿。', inputs: ['分析结论'], outputs: ['PRD'], submissionCriteria: ['PRD 覆盖功能/验收/非功能'] },
    ],
    gateChecks: [
        { checkId: 'material-complete', phaseId: 'collect', kind: 'A', machineScope: ['材料清单包含必须字段'], humanAction: [] },
        { checkId: 'scope-ok', phaseId: 'analyze', kind: 'B', machineScope: ['影响面枚举完整'], humanAction: ['人工确认影响面可信'] },
        { checkId: 'prd-review', phaseId: 'write-prd', kind: 'C', machineScope: ['PRD 章节齐全'], humanAction: ['人工仲裁 PRD 是否达标'] },
    ],
    defaults: { batchConfirm: 'per-check', clarify: { maxRounds: 3, splitMustDefault: true }, draftPolicy: 'block-finalize-not-draft' },
    p4Mode: { mode: 'auto' },
};
/** 代码审查: triage -> review -> report, A/B/C gates. */
export const CODE_REVIEW_RECIPE_ID = 'code-review';
export const CODE_REVIEW_TEMPLATE = {
    phases: [
        { phaseId: 'triage', kind: 'default', goal: '按严重度与影响面分类待审变更。', inputs: [], outputs: ['审查分级表'], submissionCriteria: ['变更按严重度归类'] },
        { phaseId: 'review', kind: 'default', goal: '逐项审查并与基线比对。', inputs: ['审查分级表'], outputs: ['审查意见'], submissionCriteria: ['意见关联到具体证据'] },
        { phaseId: 'report', kind: 'default', goal: '汇总为审查报告与结论。', inputs: ['审查意见'], outputs: ['审查报告'], submissionCriteria: ['报告含通过/驳回结论'] },
    ],
    gateChecks: [
        { checkId: 'triage-complete', phaseId: 'triage', kind: 'A', machineScope: ['分级表完整且无重名'], humanAction: [] },
        { checkId: 'review-evidenced', phaseId: 'review', kind: 'B', machineScope: ['每条意见有证据引用'], humanAction: ['人工确认证据充分'] },
        { checkId: 'report-accepted', phaseId: 'report', kind: 'C', machineScope: ['报告含结论'], humanAction: ['人工仲裁审查结论'] },
    ],
    defaults: { batchConfirm: 'per-check', clarify: { maxRounds: 2, splitMustDefault: true }, draftPolicy: 'block-finalize-not-draft' },
    p4Mode: { mode: 'auto' },
};
/** Bug 修复: reproduce -> locate -> fix+verify, A/B/C gates. */
export const BUGFIX_RECIPE_ID = 'bugfix';
export const BUGFIX_TEMPLATE = {
    phases: [
        { phaseId: 'reproduce', kind: 'default', goal: '稳定复现缺陷并记录现场。', inputs: [], outputs: ['复现步骤'], submissionCriteria: ['步骤可稳定复现'] },
        { phaseId: 'locate', kind: 'default', goal: '定位根因与触发条件。', inputs: ['复现步骤'], outputs: ['根因定位'], submissionCriteria: ['根因与触发条件成文'] },
        { phaseId: 'fix', kind: 'default', goal: '修复并验证回归。', inputs: ['根因定位'], outputs: ['补丁与回归结论'], submissionCriteria: ['补丁通过回归'] },
    ],
    gateChecks: [
        { checkId: 'repro-stable', phaseId: 'reproduce', kind: 'A', machineScope: ['复现步骤可执行'], humanAction: [] },
        { checkId: 'root-cause', phaseId: 'locate', kind: 'B', machineScope: ['根因描述完整'], humanAction: ['人工确认根因成立'] },
        { checkId: 'fix-verified', phaseId: 'fix', kind: 'C', machineScope: ['回归结果无回归'], humanAction: ['人工仲裁修复达标'] },
    ],
    defaults: { batchConfirm: 'per-check', clarify: { maxRounds: 3, splitMustDefault: true }, draftPolicy: 'block-finalize-not-draft' },
    p4Mode: { mode: 'auto' },
};
//# sourceMappingURL=seed-templates.js.map