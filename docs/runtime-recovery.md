# Runtime recovery and monitoring

This is the maintenance contract for the existing private operator workflow. Operator scripts, credentials, archive IDs, receipts and schedules stay outside Git. The repository does not install a backup daemon or guarantee unattended availability.

## Coverage and storage

Back up the complete versioned runtime snapshot, its registered media, a manifest and an isolated restore receipt. Preserve revisions, tombstones and idempotency/request receipts. Bundled content/assets remain in Git; externally hosted media and provider account configuration are outside this runtime backup.

Package only the resulting backup directory. Never include environment files, tokens, operator scripts or unrelated exports. The owner has authorized private Google Drive storage for the full runtime content/history/media. Use a verified private destination; do not infer cloud existence from a local synchronization folder. Preserve previous copies; automatic deletion is not authorized.

## Verification and freshness

1. Capture a snapshot and record its revision and actual observation time. Fetch every registered asset and verify it against the manifest.
2. Restore into an isolated local backend and require byte-for-byte snapshot/media checks. Do not restore into Production as a test.
3. Upload a uniquely named UTC archive, inspect remote existence, size and owner-only sharing, then download it and compare SHA-256.
4. Replace the latest verified receipt only after all checks pass. Record the remote ID/URL, revision, checksum and actual timestamps privately; retain the last good receipt on failure.
5. Inspect matching remote files before retrying an ambiguous upload to avoid duplicates.

The current operator policy is hourly availability/remote-copy checks, a new verified cloud snapshot every 24 hours and a stale-backup warning after 26 hours. Freshness uses snapshot observation time plus verified remote existence, never local file modification or sync status. This workflow depends on the owner’s Mac and Codex running; it is not guaranteed 24/7 infrastructure.

## Availability and incident handling

Read-only checks cover `/`, `/writing`, `/books`, `/sitemap.xml` and `/content-index.json`, without sending analytics. Allow one bounded retry. Notify for confirmed outage, stale/missing/shared backup, actionable access failure or recovery; deduplicate unchanged incidents. Healthy checks stay quiet. Preserve evidence and avoid repeated paid-access failures.

## Recovery and credentials

Prefer conditional content rollback for an individual revision; see [runtime publishing](runtime-writing.md). Do not disable runtime mode after writes and expose an obsolete bundled archive. A complete recovery must reconcile sources, media mappings, tombstones and history into a reviewed snapshot before a separately authorized Production action. An isolated local restore does not establish full provider disaster recovery.

Key rotation is a separate authorized operation: prepare the new credential privately, update the Production environment/deployment and operator, verify new-key acceptance and old-key rejection on the canonical Production endpoint. Keep tokens out of logs, archives and Git. Old immutable deployment URLs can retain their original environment; a canonical-endpoint check does not prove global revocation.
