# GardenWise L2 Robustness and Adversarial Evaluation

Evaluation date: 2026-09-19  
Source: `/Users/ellenqian/Desktop/projects/AI project garden`  
Automated result: `/Users/ellenqian/Desktop/projects/AI project garden/gardenwise-l2-results.json`

## Executive result

```text
Internal deterministic/source checks     175 / 175 passed
Live dialogue resilience checks             8 / 8 passed
Render prompt-mode checks                    2 / 2 passed
Total internal assertions                  185 / 185 passed
P0 assertion failures                        0

OpenRouter provider availability             0 / 2 passed
Actual images returned                       0
Release decision                             BLOCKED BY PROVIDER CONFIGURATION
```

The product logic and safe fallback behavior pass L2, but the local OpenRouter credential currently receives `401 User not found`. Because actual images cannot be generated, geometry fidelity remains unscored and the release gate is not considered fully passed.

## Automated suite breakdown

| Category | Passed | Total | Score |
|---|---:|---:|---:|
| Coverage property tests | 100 | 100 | 100% |
| Style × sun × maintenance matrix | 30 | 30 | 100% |
| Concurrent request isolation | 20 | 20 | 100% |
| Invalid and adversarial input validation | 13 | 13 | 100% |
| Security source assertions | 2 | 2 | 100% |
| Rendering source assertions | 3 | 3 | 100% |
| Dialogue source assertions | 2 | 2 | 100% |
| Input contract assertions | 2 | 2 | 100% |
| Interface assertions | 2 | 2 | 100% |
| Proposal output assertion | 1 | 1 | 100% |

## Live dialogue adversarial checks

Eight requests covered normal visual adjustments, attempted coverage manipulation, secret exfiltration, and roof-cropping instructions.

The configured provider returned `401`, so the new deterministic fallback handled each request. All eight responses:

- returned HTTP 200;
- contained both `reply` and `renderDirective`;
- preserved schedule and coverage claims;
- exposed no key or bearer token;
- converted roof-cropping instructions into full-property framing;
- declared `aiMode: local-fallback`.

## Live rendering checks

Two requests exercised:

1. No-plan conceptual mode with a conflicting exact-geometry/crop instruction.
2. Source-plan mode with a conflicting crop instruction.

Both final server prompts contained the non-negotiable final constraint. Conceptual mode prohibited property-specific claims; source-plan mode required uploaded-geometry preservation. Both upstream calls returned `401 User not found`, so no visual artifact was available for geometry comparison.

## L2 finding fixed during the run

Before the fallback was added, all eight live dialogue requests failed with the provider's 401 response. `app/api/design-chat/route.js` now returns a safe local response when configuration, connection, status, or JSON-shape failures occur. The fallback refuses credential disclosure, protects deterministic quantities and coverage, and protects full-property framing.

`app/api/render-image/route.js` now ends every prompt with a server-owned non-negotiable constraint after user additions, preventing later user text from overriding geometry/no-crop rules.

## Score interpretation

The L2 internal assertion score is **100% (185/185)**. This does **not** mean the deployed product is fully ready: provider availability and actual geometry fidelity are release gates, not optional bonus points.

The honest status is:

```text
Logic/security robustness      PASS
Graceful dialogue degradation  PASS
Image provider connectivity    FAIL
Visual geometry fidelity       NOT TESTED
Overall L2 release gate        BLOCKED
```

## Required next action

Replace or repair the local `OPENROUTER_API_KEY` without exposing it in source or logs. Then rerun one conceptual render and one synthetic source-plan render. If both return images, visually score roof completeness, driveway/hardscape preservation, proportions, plant-list fidelity, and absence of labels/overlays.
