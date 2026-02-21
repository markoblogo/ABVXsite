# Theme Smoke Check

Quick regression checklist for theme/ASCII behavior.

## Automated pre-check

Run one of these:

```bash
npm run smoke:theme
npm run smoke:theme -- https://abvx.xyz/
```

The script validates that theme/ASCII controls and key hooks are present in HTML.

## Manual visual check (4 states)

Check these states from the homepage and one inner page (for example `/writing`):

1. `default + light`
- Header logo is readable.
- Main text/body copy is readable.
- Primary/secondary buttons have readable text.
- World time dock colors match page theme (no dark-on-light mismatch).

2. `default + dark`
- Header logo is readable.
- Main text/body copy is readable.
- Buttons and links keep strong contrast.
- World time dock colors match dark theme.

3. `ascii + light`
- ASCII toggle text changes to `Default`.
- Main text and cards are high-contrast (blue on white).
- Dark utility buttons become readable (no blue-on-black text).
- World time dock follows light state and remains readable.

4. `ascii + dark`
- ASCII terminal palette is readable (green on black).
- Header controls remain visible and usable.
- Hero stickers render as ASCII boxes where configured.
- Footer AsciiTheme note remains visible and link is readable.

## Pass criteria

- No theme desync between page and world time dock.
- No unreadable text/logo in any of the 4 states.
- No duplicated theme toggles in header.
