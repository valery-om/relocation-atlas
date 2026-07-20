# Relocation Atlas

Relocation Atlas is a privacy-first decision engine that turns fragmented immigration options into a transparent path from temporary stay to residence and citizenship.

[Open the live demo](https://atlas.valeryom.com/) · [OpenAI Build Week](https://openai.devpost.com/)

## Why this exists

Relocation decisions are often framed as “Which country is best?” That hides the most important differences:

- a temporary visa may not count toward permanent residence;
- a residence permit may not lead to citizenship;
- a status may not authorize the user's real work;
- rules may differ by passport, family composition, physical presence, or consular access;
- lifestyle fit and legal eligibility are not the same score.

Atlas starts with the outcome a household needs, evaluates hard blockers, and then compares softer preferences without presenting a ranking as a probability of approval.

## What the public beta includes

- 40 routes across 35 countries;
- 50 city planning profiles;
- 63 route-source links;
- 11 official-source work profiles;
- three independent legal outcomes: temporary stay, residence, and citizenship path;
- eight visa families kept separate from outcome;
- household budget, work model, geography, climate, family, and time-horizon inputs;
- hard blockers, source freshness, confidence, unknowns, work rights, and family consequences;
- local-only profile storage with manual JSON import/export.

The first researched nationality layer is for Russian passport holders. Ukrainian and Belarusian layers are visible as planned work and are not treated as equivalent without verification.

## Two-minute judge path

1. Open <https://atlas.valeryom.com/>.
2. Keep the fictional default household or change its budget/work preferences.
3. Choose a target outcome: temporary, residence, or citizenship.
4. Press the large calculate button.
5. Review the leader and three trajectories.
6. Open a route and inspect its legal chain, work status, family effect, sources, freshness, and unknowns.
7. Change an answer: the old result disappears until recalculation.

The interface is currently optimized for Russian-speaking users; the Devpost description, demo narration, captions, and testing guide provide the English judging path.

## Run locally

No API keys, account, package manager, or build step are required.

```sh
git clone https://github.com/valery-om/relocation-atlas.git
cd relocation-atlas
python3 -m http.server 8000
```

Open <http://localhost:8000/>. The root page redirects to `/dashboard/`.

## Architecture

```text
index.html
dashboard/
  index.html       semantic UI and questionnaire
  styles.css       responsive visual system
  app.js           profile, validation, ranking, rendering, import/export
routes/
  platform-data.js dated public route/country/city/work snapshot
```

The public repository is the runnable, judge-safe artifact. The private research workspace uses a deterministic schema validator and a privacy-gated build that copies only these runtime files. Evidence, personal intake, internal status, and research notes are not included.

## Built with Codex and GPT-5.6

The project was created during the OpenAI Build Week submission period. Codex with GPT-5.6 acted as the primary research, product, engineering, and QA partner:

- researched official sources and separated canonical facts from derived UI data;
- designed the route, country, city, nationality, work-right, source, and freshness schema;
- implemented and refactored the dependency-free application;
- created deterministic schema and publication checks;
- tested desktop/mobile behavior and debugged state and cache issues;
- automated a privacy-safe GitHub Pages deployment;
- documented decisions through Issues, commits, and a shared UX contract.

Codex provided the agentic workspace and tool execution layer. GPT-5.6 was the model recorded in the primary build thread and powered the multi-step reasoning and code generation: route-constraint analysis, schema design, implementation/refactoring, validator construction, failure diagnosis, and browser-QA evaluation.

The app intentionally has no runtime AI or server dependency. GPT-5.6 is not a decorative API call; its meaningful integration is the core Codex development workflow that created and verified the product. The user experience remains fast, inspectable, and local-first.

## Build timeline

- July 14, 2026 — workspace and operating protocol created;
- July 15 — global route research, interactive Atlas, three-level outcome model, visa taxonomy, and validator;
- July 17 — livelihood/work layer, local privacy model, static build, responsive UX stabilization, and public deployment;
- July 19 — shared UX contract and final validated publication.

The commit history provides dated evidence for the work completed inside the submission window.

## Data, privacy, and limitations

- Questionnaire answers stay in browser `localStorage`; there is no server-side profile.
- JSON import/export is initiated by the user.
- Source dates and gaps are visible in the UI.
- City costs are broad planning ranges, not live quotes or personal budgets.
- A route score is not a legal opinion or approval probability.
- Immigration rules change; users must verify current official requirements before acting or paying.

## License

Software source code is licensed under the MIT License. The Atlas dataset, project-authored text, visual design, and brand are © 2026 Valery OM, All Rights Reserved. Third-party names, source material, and linked content remain subject to their respective owners' terms. See [`LICENSE`](LICENSE).
