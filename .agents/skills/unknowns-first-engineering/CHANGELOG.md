# Changelog

## 3.1.1 — 2026-08-05

- Combined v3.1's compact routing, high-risk local exception, layer diagnosis, bounded loops, coordination, and expanded domains with v3.0's explicit baseline, falsifiable debugging loop, bilingual package tooling, examples, output-eval protocol, and MIT license.
- Canonicalized provider, database/migration, deployment, and docs-site guidance on the v3.1 filenames; folded long-running progress rules into loop engineering.
- Restored reproducible package validation, trigger evaluation, secret scanning, stable trigger case IDs, and explicit release-evidence boundaries.
- Synchronized README, manifest, interface, Skill IR, and release reports to v3.1.1.
- Removes historical backup/source copies only after the final v3.1.1 release gate passes.

### Working-draft amendments (2026-08-05, no version bump)

- Clarified the mode × tier relationship: mode is the outcome the request owes (Explain/Explore/Plan/Implement/Review/Verify); tier is the evidence depth that outcome justifies (Trivial/Standard/High-risk). Take the mode from the request; set the tier from the cost of being wrong.
- Made the "Learn or finish" step of the header loop explicit under "Verification and completion", linked to `references/teach-back.md`.
- Re-ran the deterministic trigger eval after the edits: 28/28, zero false positives and zero false negatives (`reports/trigger-eval-2026-08-05.json`).
- Collected external prior-art evidence for the first time: SkillsMP 21 candidate families (`reports/prior-art-candidates.json`), read-only inspection of `affaan-m/ecc` skills (convergent mechanisms validated, none copied); skills.sh remains missing evidence on Windows (no `npx.exe` for subprocess resolution).
- Added qiaomu-meta-skill audit artifacts: `reports/qiaomu-validate.json`, `reports/qiaomu-release-check.json`, `reports/skill-ir-qiaomu.json`, `reports/secret-scan-2026-08-05.json`, and `reports/audit-2026-08-05.md`.
- Real-model trigger eval (skill-creator `run_loop.py`): inconclusive — the installed same-name skill shadows injected candidates in fresh `claude -p` sessions; recorded as missing evidence, no description change adopted.
- No version bump and no publication; the installed package remains untouched.

## 3.1.0 — 2026-08-05

- Tightened automatic routing to non-trivial repository work and high-risk local changes.
- Added explicit non-trigger boundaries for typos, obvious local edits, exact lookups, general explanations, and brainstorming.
- Reduced the root skill to the adaptive router, core invariants, bounded loop, and reference map.
- Added a production interface contract, manifest, and trigger-boundary evaluation.
- Renamed historical backup entrypoints to `SKILL.fixture.md` so only the active package is discoverable.

## 3.0.0

- Added simplicity-first, surgical-change, and goal-driven behavior principles.
- Added explicit prompt/context/harness/loop/graph layer diagnosis.
- Added bounded execution loops, no-progress detection, and completion checks.
- Added optional multi-agent graph coordination without forcing subagents.
- Added auth, database, frontend, CI/CD, and ML/data domain guides.
- Clarified that approved specs should not be brainstormed again.
- Clarified that TDD is selected when it improves evidence, not imposed universally.
- Preserved adaptive trivial, standard, and high-risk paths.

## 2.0.0

- Reworked the skill into a compact core with progressively loaded references, domain guidance, and host adapters.
- Added adaptive scaling and model-agnostic behavior.
