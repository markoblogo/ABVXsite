# CortexABV Repository Change Proposal v1

`CortexABVRepositoryChangeProposal` compares two explicit `CortexABVRepositoryObservationSnapshot` files and creates a compact evidence receipt for repository-state review.

## Contract

The comparator accepts only snapshots that:

- use `schemaVersion: 1` and the expected observation snapshot kind;
- originate from the same Public Project Registry source digest;
- cover exactly the same public-read repository identifiers without duplicates.

This prevents an edited registry, a new project link, or a private-repository policy change from being misrepresented as a repository-state change.

## Output

The receipt has:

```json
{
  "authority": "proposal",
  "externalSideEffects": false,
  "reviewStatus": "pending_review"
}
```

It records only changed repository-state fields:

- `status` or `reason` when availability changes;
- default branch;
- head SHA;
- pushed/updated timestamps;
- visibility.

Every change carries the project/landing mapping and inherited public provenance. Evidence identifies the two source snapshot digests, their observation timestamps, and the shared registry digest. It does not include repository content, commit messages, file diffs, instructions, model output, or a requested action.

When no tracked field changes, `reviewStatus` is `no_changes` and the receipt is empty.

## Run

Create a fresh snapshot separately, then compare it with a baseline:

```bash
npm run cortex-abv:observe-public-repositories -- --output /tmp/cortex-abv-repository-candidate.json
npm run cortex-abv:compare-repository-snapshots -- \
  --baseline cortex-abv/public-repository-observation-snapshot.v1.json \
  --candidate /tmp/cortex-abv-repository-candidate.json \
  --output /tmp/cortex-abv-repository-change-proposal.json
```

The GitHub Actions workflow `Compare public repository snapshots` is manual-only. It saves the candidate and receipt as an artifact; it does not modify the committed baseline. Advancing a baseline remains a separate human-reviewed repository change.

## Non-goals

This capability does not trigger the existing project-copy workflow, create a pull request, send a message, or update an ABVX page. A later proposal consumer would need its own explicit contract, evaluation gate, approval record, and rollback notes.
