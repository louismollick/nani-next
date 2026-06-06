<img width="1354" height="869" alt="Screenshot 2026-06-06 at 12 16 25 AM" src="https://github.com/user-attachments/assets/b66b05a5-02a8-4bf6-8b05-c7648d6a5949" />

Nani next? helps Japanese learners find their next anime to study japanese.

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
