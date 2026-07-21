# Relocation Atlas

**From “Where can we go?” to a relocation plan your family can inspect.**

[Open the English judge demo](https://atlas.valeryom.com/dashboard/?lang=en#top) · [Open the default experience](https://atlas.valeryom.com/) · [OpenAI Build Week](https://openai.devpost.com/)

## Why it exists

Moving countries is not one decision. A visa can let someone enter without permitting their real work, supporting their family, or leading to permanent residence or citizenship.

Relocation Atlas starts with the outcome a household needs, applies hard constraints before preferences, and keeps the reasoning visible. It is not a country quiz and its score is not a probability of approval.

## Two-minute judge path

No account, API key, or personal data is required.

1. Open the [English judge path](https://atlas.valeryom.com/dashboard/?lang=en#top).
2. Select **Load judge demo**. An anonymous fictional household is loaded and calculated automatically.
3. Review the leader and three trajectories. Comparative fit, blockers, and unknowns remain separate.
4. Open a route. Inspect its legal outcome chain, work and family signals, checked date, confidence, and official sources.
5. Open **Compare**, then **My Plan**. The demo includes an anchor, fallback, research route, three cities, five separate readiness gates, and a verification board.
6. Change one profile answer. The old result and plan become stale until recalculation.
7. Download **My Plan JSON**. The full fictional decision snapshot is assembled locally in the browser.

## What the beta includes

- 40 routes across 35 countries;
- 50 city planning profiles and 63 route-source links;
- 11 official-source work profiles;
- an initial child-education layer for the United Kingdom, Germany, and Portugal;
- separate temporary, residence, and citizenship outcomes;
- budget, work, family, city, presence, confidence, checked-date, and unknown signals;
- one isolated what-if scenario and a user-controlled finalist round;
- local-only profile, progress, and plan storage with JSON import/export;
- reversible Russian/English presentation over one model and one dated dataset.

The first researched nationality layer is for Russian passport holders. Ukrainian and Belarusian layers are planned and are not treated as equivalent without verification.

## The final product layer

The July 20 release completed the path from recommendation to action:

| Layer | What a judge can verify |
|---|---|
| Explainable decision | One leader, three trajectory roles, visible blockers, strict-presence constraints, confidence, dates, and sources |
| `My Plan` | Profile, comparison, blockers, unknowns, source dates, verification board, and local JSON export |
| What-if | One isolated alternative for budget, presence, work, or family without changing the real profile |
| Child and education | Separate dependent, education-route, accompanying-parent, and nursery/school signals |
| Finalist round | User-owned anchor/fallback/research roles, dated cities, and five independent readiness gates |
| Judge access | Reversible English presentation, anonymous demo, stable long-page navigation, and mobile/keyboard reliability |

## Run locally

The public artifact is dependency-free. It needs no package manager, account, backend, or build step.

```sh
git clone https://github.com/valery-om/relocation-atlas.git
cd relocation-atlas
python3 -m http.server 8000
```

Open <http://localhost:8000/?lang=en#top>. The root page preserves the language and section when it redirects to `/dashboard/`.

## Architecture

```text
index.html
dashboard/
  index.html       semantic product journey
  styles.css       responsive visual system
  app.js           profile, decision model, state, rendering, import/export
  i18n.js          reversible RU/EN presentation layer
  favicon.svg      Atlas browser mark
routes/
  platform-data.js dated derived route/country/city/work/family dataset
```

The public repository is the runnable judge artifact. A private research workspace owns the official-source notes, deterministic schema validator, and privacy-gated build. The gate copies only the interface, public documentation, license, and dated derived dataset; personal intake, evidence, internal decisions, status, skills, and research notes are excluded.

## Built with Codex and GPT-5.6

Relocation Atlas was created during the OpenAI Build Week submission period. Codex with GPT-5.6 was the primary product, engineering, research, and QA environment.

Codex provided the agentic workspace and tool execution layer: repository inspection, research workflows, implementation, GitHub coordination, browser testing, failure diagnosis, validation, and release verification. GPT-5.6 powered the long-horizon reasoning and code generation in the primary build thread.

Specific contributions included:

- translating official-source research into a normalized route/country/city/work/family schema;
- separating visa family from legal outcome and hard blockers from comparative fit;
- implementing the bilingual local-first application and profile migrations;
- designing stale-result behavior, isolated what-if scenarios, finalist roles, and portable plan export;
- building schema and privacy checks before publication;
- debugging state, cache, responsive, keyboard, and drawer behavior through browser QA.

The final app intentionally has no runtime AI dependency. GPT-5.6's meaningful role is the auditable build workflow that created and challenged the system, rather than a chatbot added for presentation.

Primary Codex build Session ID: `019f6036-929c-75a1-85ec-bf115ad5ad0a`.

## Decisions that shaped the product

**Outcome before country.** Temporary stay, residence, and citizenship answer different questions.

**A score cannot erase a stop sign.** Unauthorized work, nationality restrictions, insufficient resources, incompatible presence, and unknown facts remain visible.

**The user owns the conclusion.** Atlas can narrow the field; only the user assigns an anchor or fallback. Those roles never rewrite legal data.

**Privacy is architectural.** Questionnaire answers and downloaded plans stay local. No user account or server-side profile exists.

## Build trail

- July 14, 2026 — workspace and first commit;
- July 15 — global route screen, interactive Atlas, three-level outcome model, visa taxonomy, and validator;
- July 17 — livelihood/work layer, privacy-gated static build, responsive stabilization, and custom domain;
- July 19 — shared UX contract and validated public artifact;
- July 20 — explainable consumer journey, `My Plan`, what-if analysis, child-education layer, finalist roles, English judge path, favicon, and scroll stabilization.

The dated commit history and primary Codex Session ID provide the build-window evidence.

## Data, privacy, and limits

- Questionnaire answers stay in browser `localStorage`; there is no server-side profile.
- JSON import/export happens only after a user action.
- Source dates, confidence, blockers, and gaps remain visible.
- City costs are planning ranges, not live prices or personal budgets.
- Child-education coverage is intentionally narrow and never implies a parent's status.
- A comparative fit score is not legal advice or an approval probability.
- Immigration rules change; verify current official requirements before acting or paying.

## License

Software source code is licensed under the MIT License. The Atlas dataset, project-authored text, visual design, product name, and brand are © 2026 Valery OM, All Rights Reserved. Third-party names, official materials, and linked sources remain subject to their owners' terms. See [`LICENSE`](LICENSE).
