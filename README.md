# jimaku-watch-list

This app helps Japanese learners pick anime to watch with Japanese subtitles.

It answers three questions at once:

- Is a Japanese subtitle file available on Jimaku?
- Is the anime too hard or at a good level?
- Is it already on my anime list?

The app combines data from:

- AniList or MyAnimeList for what you want to watch
- Jimaku for Japanese subtitle availability
- jpdb.io for subtitle difficulty data
- Learn Natively for rough reading level

## Local dev

```bash
pnpm install
pnpm dev
```

## Data refresh scripts

```bash
pnpm refresh-jimaku-snapshot
pnpm refresh-jpdb-anime-difficulty
pnpm refresh-learnnatively-animation-levels
```
