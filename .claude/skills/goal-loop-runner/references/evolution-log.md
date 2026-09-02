# Goal Loop Runner Evolution Log

This log records user-directed operating requirements and reusable improvements that have objective evidence or are stable safety/operational invariants. Per-goal hypotheses and one-off workarounds remain in the selected goal state's iteration log.

## 2026-09-01 — Final-deliverable ownership and validated evolution

- **Trigger:** The user established that they will specify the final deliverable, while the agent must autonomously pursue it through repeated, evidence-backed attempts rather than ending at the first failure.
- **Exact change:** Added the `Final-deliverable ownership` policy: recoverable failure is an iteration result; choose a materially different next action; rerun the objective gate; do not conclude while a credible safe action remains. Added the rule to update only the smallest relevant skill/reference after later validation or a user-established invariant.
- **Evidence:** The prior skill required individual iterations and recovery but did not explicitly prohibit finalizing on a repairable failed attempt or direct the agent to update relevant reusable guidance from a validated gap.
- **Scope:** Applies to goal-driven work only. It does not authorize new external actions, broaden permissions, or replace the three-cycle external-blocker policy.
- **Rollback condition:** If the policy causes unbounded work, repeated unchanged actions, or a safety/authorization conflict, retain the existing blocked-stop rules and narrow the policy to the affected goal type after evidence review.

## 2026-09-01 — Speech-to-text interpretation default

- **Trigger:** The user established that their messages are voice input transcriptions and can contain recognition errors, repetitions, and broken phrasing.
- **Exact change:** Added a preflight default to infer the coherent intended meaning using active-goal context and evidence, while treating the inference as an assumption and requesting one clarification only for materially different authority, outcome, verification, or risk interpretations.
- **Evidence:** This is an explicit user-established operating convention; the skill already recognized fuzzy and voice-transcribed input but did not make speech-to-text the default input model or specify what may be retained.
- **Scope:** Applies to interpretation before goal work. Confirmed corrections are task facts in goal state; only the stable convention is reusable guidance. It does not authorize an inferred external action or change a safety boundary.
- **Rollback condition:** If the default repeatedly produces a material misinterpretation, restrict it to explicitly marked voice input and retain the clarification gate for consequential ambiguity.
