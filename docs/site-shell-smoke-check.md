# Public shell smoke check

Use this after layout, navigation, metadata, or global styling changes.

## Automated check

Run against a local production build or the public site:

```bash
npm run smoke:shell
npm run smoke:shell -- https://abvx.xyz/
```

The check verifies the primary navigation, ABVX brand mark, homepage positioning, primary actions, footer navigation, and machine-readable index links.

## Visual check

Run the existing desktop and mobile route sweep:

```bash
npm run qa:visual
```

Confirm that the header and footer remain readable, the primary actions are visible, focus states are clear, and no card or media block overlaps at the supported viewports.
