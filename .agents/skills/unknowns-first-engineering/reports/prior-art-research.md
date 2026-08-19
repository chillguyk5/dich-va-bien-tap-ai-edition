# Prior-art research

Date: 2026-08-05 (updated with external catalog evidence)
Target: v3.1.1 hybrid (working draft after logic tightening)

## Scope

This iteration tightened routing and packaging of an existing local engineering workflow and, for the first time, collected external catalog evidence for the package.

## Sources inspected

1. Active `unknowns-first-engineering` v3 package before revision.
2. Historical local snapshot `unknowns-first-engineering.backup-20260727-014821/SKILL.fixture.md`.
3. Historical local snapshot `unknowns-first-engineering.backup-20260729-115323/SKILL.fixture.md`.
4. Qiaomu Meta Skill 2.8.1 routing, trigger-eval, and production-package requirements.
5. External catalog: SkillsMP queries on 2026-08-05, 3 intent-shaped queries, 21 candidate families (full list: `reports/prior-art-candidates.json`).
6. Inspected candidate sources (read-only via GitHub API; no candidate code executed):
   - `affaan-m/ecc` `skills/agentic-engineering/SKILL.md` — MIT, 237,671 repo stars, last update 2026-08-04.
   - `affaan-m/ecc` `skills/ai-first-engineering/SKILL.md` — same repo.
   - `affaan-m/ecc` `skills/search-first/SKILL.md` — same repo.
   - `openclaw/openclaw` repository metadata — license NOASSERTION, not adopted and not source-inspected.

## Metrics semantics

- Skills.sh installs: ecosystem install telemetry; not ratings or correctness. **Not run** on this machine (Windows subprocess cannot resolve `npx.cmd`; no `npx.exe` exists) — recorded as missing evidence, not proof that similar skills do not exist.
- SkillsMP repository stars: GitHub repository popularity; not installs, user ratings, or skill-specific quality.
- No combined cross-catalog score is calculated; metrics remain separate.

## Keep / adapt / reject / invent

- **Keep:** unknowns-first discovery, risk-proportionate paths, surgical changes, evidence-bound verification, and bounded retry loops.
- **Adapt:** no new mechanism adopted from external candidates. The three inspected ECC skills converge on behaviors this package already carries — "define completion criteria before execution" (ECC agentic-engineering principle 1 ≈ the package's "state observable success"), and "report skipped channels honestly" (ECC search-first preflight ≈ the package's "label unrun checks honestly"). Convergence is noted as validation, not copied prose.
- **Reject:** ECC `agentic-engineering` 15-minute unit rule and Haiku/Sonnet/Opus model-routing tables (team-specific process; would narrow a model-agnostic router); ECC `ai-first-engineering` team operating model (out of scope for a model-facing routing skill); all `openclaw/openclaw` candidates (unasserted license; no source review without license resolution).
- **Invent:** (existing, validated by this pass) bilingual trigger fixture, local high-risk one-line trigger cases, deterministic fixture eval, and root-entrypoint isolation. No direct prior art found for these mechanisms in the searched catalogs.

## External catalog evidence

- Run command: `research_prior_art.py` with 3 queries, `--strict --summary`, `--skip-skills-sh`.
- SkillsMP: OK, 21 candidate families across 3 queries; query runs and families recorded in `reports/prior-art-candidates.json`.
- skills.sh: not run (Windows subprocess limitation) — `missing evidence`.
- No install counts, ratings, or skill-level quality metrics available; claims are limited to read-only source inspection of 3 shortlisted skills.

## Security and trust

No untrusted candidate code was executed. Candidate `SKILL.md` files were inspected read-only through the GitHub API. `openclaw` candidates were deliberately not inspected because the repository license is unasserted.
