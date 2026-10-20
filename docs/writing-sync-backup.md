# Independent Writing sync clock

The Cloudflare Cron Worker in `infra/writing-sync-backup/` is a backup trigger for the existing `writing-feed-sync.yml` workflow. It does not fetch article bodies, import feeds, write GitHub content, or deploy ABVX itself. The existing workflow retains its tests, three-file write boundary, concurrency group, and no-change/no-deployment behavior.

## Behavior and limits

- Cloudflare ticks at minutes 7, 22, 37 and 52 UTC: five minutes after the existing GitHub schedule. A main-branch successful run started within 12 minutes suppresses backup dispatch. An active run suppresses duplicate dispatch; one older than 30 minutes raises an error for investigation.
- Otherwise the Worker dispatches only `markoblogo/ABVXsite`, `writing-feed-sync.yml`, `main`. Failed runs do not count as healthy. GitHub failures, invalid timestamps and missing secrets stop the check; the Worker does not blindly retry a possibly accepted dispatch.
- Lookup reads at most 20 recent runs with ten-second request timeouts. Occasional simultaneous cron deliveries can both dispatch before GitHub exposes a new run. The existing GitHub concurrency group serializes them; the importer preserves first-addition dates and does not duplicate content. No additional database or lock service is introduced.
- With the GitHub clock unavailable, the backup attempts a check every 15 minutes. The normal-to-backup handover can take about 20 minutes. Upstream RSS delays, GitHub runner queues, build time, provider outages and secret expiry still affect public arrival; this is not an exact 15-minute publication SLA.
- This is 96 lightweight timer invocations/day. It is designed for Workers Free; confirm the owner's available account limits before deployment. No paid plan, model, new npm dependency or continuously running server is required. Vercel Hobby cron is unsuitable because it permits only daily jobs.

No HTTP handler, public Worker URL, Preview URL or custom domain is configured. Scheduled executions log only the clock timestamps and outcome (`disabled`, `fresh`, `active`, `dispatched`). Failures are visible in Cloudflare invocation logs; there is no new automatic notification channel. A dispatch acknowledgment proves acceptance, not successful import or publication.

## Activation gate

Merging this source does **not** deploy or enable the backup. `ENABLED` defaults to `false`. The owner must approve the Cloudflare deployment and the new GitHub credential before activation.

Create a separate, expiring **fine-grained GitHub token** limited to the `ABVXsite` repository with **Actions: read and write** and the mandatory metadata read permission. No Contents write permission is needed. GitHub grants Actions permission for the repository, not just this single workflow; the Worker code restricts its requests to the Writing workflow. Do not reuse/export a broader personal CLI credential or the workflow's existing content-write token.

Store it only as the encrypted Cloudflare secret `GITHUB_DISPATCH_TOKEN`, using the vendor's secret prompt or dashboard. Never put the value in chat, Git, this configuration, a command argument or a log. Confirm the chosen Cloudflare account and token expiry privately.

Use the qualified Wrangler version, 4.151.2, from the site checkout:

```sh
# Local bundle validation: no Cloudflare deployment or GitHub dispatch.
npx wrangler@4.151.2 deploy --dry-run --config infra/writing-sync-backup/wrangler.json --outdir "$PWD/exports/writing-sync/worker-dry-run"

# Only after owner approval: create the disabled Worker, then enter the secret
# directly into the vendor prompt (secret put deploys a version immediately).
npx wrangler@4.151.2 deploy --config infra/writing-sync-backup/wrangler.json
npx wrangler@4.151.2 secret put GITHUB_DISPATCH_TOKEN --config infra/writing-sync-backup/wrangler.json

# Explicit activation; repeat this flag on future approved live deployments.
npx wrangler@4.151.2 deploy --config infra/writing-sync-backup/wrangler.json --var ENABLED:true

# Disable without deleting data or touching the GitHub schedule.
npx wrangler@4.151.2 deploy --config infra/writing-sync-backup/wrangler.json
```

After deployment, allow up to 15 minutes for Cron configuration propagation. Verify a real **scheduled** invocation and its logged outcome. For a recovery invocation, follow the specific dispatched GitHub run through its checks, any content commit, exact production SHA and actual Writing page. A local fixture, dry-run bundle or GitHub HTTP acknowledgment alone is not production verification. Record initial evidence privately under ignored `exports/writing-sync/`; never restart a timer to hide an unsuccessful attempt.

Review or rotate the limited token before expiry. A 401/403 is an access failure, not a healthy/no-change run. If a workflow is stuck, inspect it before authorizing cancellation; the backup must not cancel runs or weaken concurrency/security settings.

References: [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [encrypted secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [GitHub workflow dispatch and token permissions](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event), [Vercel cron plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
