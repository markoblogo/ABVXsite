# Publication and performance audit — 2026-10-10

Scope: the publication path, GitHub CI/Vercel deployment decisions, request-time content loading, SEO/discovery, CSP and representative desktop/mobile rendering. Baseline: production source `698731c61d39f3373ca7f92ea966bdc61687d299`. This is an operational audit, not an exhaustive security review or a real-user Core Web Vitals assessment.

## Findings and implemented changes

1. **Repeated filesystem work.** A warmed homepage request read 193 content Markdown files; Writing read 22. Shared getters now reuse results within the React server render/request. The same instrumented production-server probe measured 104 and 11 reads respectively (46% and 50% fewer). Books remained 112 and Systems 49; do not claim that every route improved. Request-level reuse avoids introducing process-lifetime publication-date staleness. React documents the [request lifetime and Server Component scope of cache](https://react.dev/reference/react/cache).
2. **Documentation rebuilds.** Documentation-only changes previously requested an application build. `scripts/deployment-scope.mjs` uses an explicit Markdown allowlist. CI keeps installation, content/ecosystem validation, lint, sync/vector tests and dependency audit, skipping only the application build and its generated catalogue check when the diff is documentation-only. Unknown history, an empty diff or any other file triggers a build.
3. **Safe Vercel skipping.** `vercel.json` reuses this classifier with `VERCEL_GIT_PREVIOUS_SHA`, the previous successful deployment baseline. It never substitutes `HEAD^`: a failed runtime change followed by a docs commit must still build. Missing baseline/history builds conservatively. Regression fixtures cover docs, runtime changes, missing history, renames, deletions and the failed-deployment sequence. The [Vercel ignored-build convention](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel) is exit 0 to skip, exit 1 to build; the [previous deployment variable](https://github.com/vercel/vercel/discussions/7251) supplies the project/branch baseline. If the project cannot expose/retrieve that history, optimization is unavailable and the safe full build remains.
4. **Static-file proxy work.** Existing media/brand/font paths and machine-index files bypass per-request HTML nonce generation. HTML CSP remains enforced. Global security headers remain in Next configuration.
5. **Fragile SEO waiting.** A local SEO run timed out waiting for the homepage's full load although the build passed. SEO navigation now waits for DOM content, then runs the existing metadata, route, language navigation, index and responsive assertions. It does not wait for unrelated remote image/analytics completion. Media/player and CSP checks remain separate.
6. **Release visibility.** `content:release-check` receipts now record each check's elapsed time and total duration, including failures. Retain receipts locally; do not commit generated logs.

## Measurements and verification

The last baseline main CI run (`38073459894`) completed in approximately 61 seconds: checkout 12 s, install 11 s, lint 9 s, build 13 s, remaining checks individually short. CI is already relatively small; repeated manual release attempts and unnecessary builds are the higher-value targets. All existing runtime quality gates remain.

| Local desktop route | Before DCL / load / LCP, ms | After DCL / load / LCP, ms |
| --- | --- | --- |
| `/` | 166 / 230 / 180 | 96 / 157 / 132 |
| `/focus` | 87 / 100 / 96 | 79 / 103 / 104 |
| `/systems` | 43 / 62 / 72 | 45 / 59 / 48 |
| `/books` | 96 / 123 / 96 | 52 / 96 / 88 |
| `/writing` | 47 / 58 / 76 | 27 / 44 / 84 |
| `/work/mn7r` | 46 / 55 / 72 | 35 / 45 / 52 |

These are single local production-build samples at 1440 px, with cache/network variation, not a causal speed guarantee or mobile field data. Both samples had CLS 0 and no broken detected images. The deterministic filesystem read reduction is stronger evidence than the timing differences.

Validation: 122 sync/content tests, 23 vector-runtime tests, content/ecosystem validation, lint and local webpack production build passed. SEO/discovery verified 193 distinct routes/titles, complete public indexes, dates, localization and mobile/desktop navigation. Production dependencies reported 0 vulnerabilities. CSP QA covered the six standard routes plus the YouTube project route. A default build is still required in CI/Vercel; the local webpack fallback changes no deployment setting.

## Repeatable release

Use the existing editorial checklist and `content:release-check` once on the complete source/media/index batch before one PR. Repair and rerun only affected checks after a failure; regenerate/rebuild when source or runtime changes require it. Wait for CI and preview, merge the verified head, then separately prove the production merge SHA, canonical content and relevant rendering. A build-skip fixture test is not evidence that a future Vercel deployment was actually skipped. Unchanged cron feeds already avoid commits; no additional scheduler is needed.

## Priorities after this pass

- **CHEAP:** use receipt durations and provider timings over several releases before changing CI again. Keep source, first-addition chronology and generated indexes in one PR.
- **NORMAL:** measure public mobile resource transfer and slow-network LCP on the image-heavy Books/Systems routes. Local source image size alone is not transfer evidence: existing Next Image and AVIF/WebP derivatives already reduce many requests.
- **NORMAL:** evaluate narrow caching of stable public data after measuring production latency. Do not remove nonce CSP or force all pages static; the current root deliberately reads request language/nonce context.
- **CHEAP:** review page-filtered Search Console/Plausible results after sufficient new data. Machine-index completeness helps discovery but does not prove Google indexing, rankings or traffic growth.

No new dependency, CMS, paid service, blanket cron change or external-content auto-rewrite was added.
