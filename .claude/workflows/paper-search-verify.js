export const meta = {
  name: 'paper-search-verify',
  description: '并行检验一批候选论文是否符合筛选条件',
  phases: [{ title: 'Verify', detail: '每个候选一个检验智能体' }],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    dedup_key: { type: 'string' },
    verdict: { type: 'string', enum: ['pass', 'fail', 'defer_browser'] },
    fail_reason: { type: ['string', 'null'] },
    enriched: { type: 'object' },
  },
  required: ['dedup_key', 'verdict', 'enriched'],
}

const task_id = args.task_id
const rules = args.rules
const candidates = args.candidates

function verifyPrompt(c) {
  return [
    '你是论文检验智能体。请先阅读 `D:/Claude_project/search_paper/.claude/skills/paper-search-verifier/SKILL.md` 并严格按它执行。',
    'task_id: ' + task_id,
    '筛选规则 rules（JSON）：',
    JSON.stringify(rules, null, 2),
    '待检验候选 paper（JSON，已带 dedup_key）：',
    JSON.stringify(c, null, 2),
    '返回结果必须符合 schema：{ dedup_key, verdict(pass|fail|defer_browser), fail_reason, enriched }，并把 enriched 写到隔离文件 tasks/' + task_id + '/verify/<sanitized_dedup_key>.json。',
  ].join('\n')
}

phase('Verify')
const results = await parallel(candidates.map((c) => () =>
  agent(verifyPrompt(c), {
    label: 'verify:' + (c.dedup_key || 'paper'),
    phase: 'Verify',
    schema: VERIFY_SCHEMA,
    agentType: 'general-purpose',
    effort: 'low',
  })
))

return results.filter(Boolean)
