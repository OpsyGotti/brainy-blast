# Brainy Blast

A colourful trivia and practice site for UK school children, from Year 1 to GCSE.

- **Subjects:** Maths, English, Science, Tech Skills (computing) and General Knowledge
- **Levels:** Years 1–2 (KS1), 3–4, 5–6 (KS2), 7–9 (KS3) and 10–11 (GCSE)
- **Three tries per question**, with a hint after the first wrong answer and an explanation afterwards
- **Rewards:** XP and levels, 8 ranks, 21 badges, coins, a prize shop, day streaks and a Daily Challenge
- **Report card:** practice grades per subject, using the words UK school reports use
- **Leaderboard:** weekly and all-time, filterable by school year, shared by everyone using the site
- **Player cards:** nickname, school year, a cartoon character or a photo. Several children can share one device.
- Works on phones, tablets and desktops.

## ✏️ Adding questions

The English, Science, Tech Skills and General Knowledge questions are spreadsheet (CSV) files in **[`public/questions`](public/questions)**. Edit them on GitHub or in Excel and commit. The live site updates on its own within a couple of minutes. **Full instructions: [public/questions/README.md](public/questions/README.md)**

Maths questions are generated automatically in `public/questions.js`.

## Files

```
public/                     the website (this folder is what Cloudflare serves)
  index.html, styles.css
  app.js                    game, rewards, player cards, leaderboard
  questions.js              maths question generators
  questions/*.csv           ← the question files you edit
  _worker.js                leaderboard server (runs on Cloudflare, not visible to visitors)
  _headers                  makes sure new questions show up straight away
scripts/check_questions.py  spots mistakes in the question files
.github/workflows/          runs that check on GitHub after every change
```

## Setting up GitHub + Cloudflare (one time)

### 1. Put the code on GitHub
Create a new repository on github.com (for example `brainy-blast`), then push this folder to it.

### 2. Database
If you already created the `brainy-blast` D1 database, reuse it, and the leaderboard is kept. Otherwise go to **Storage & Databases → D1 SQL Database → Create** and name it `brainy-blast`. The site creates its own tables.

### 3. Connect Cloudflare Pages to GitHub
A project made with drag-and-drop upload can't be switched to GitHub later, so make a new one.

1. **Workers & Pages → Create → Pages → Connect to Git**, then authorise GitHub and pick the repository.
2. Build settings: **Framework preset:** None · **Build command:** *(leave empty)* · **Build output directory:** `public`
3. **Save and Deploy**.
4. In the new project, go to **Settings → Bindings → Add → D1 database**. Set the variable name to `DB` and pick `brainy-blast`.
5. **Deployments → Retry deployment** on the latest deployment, or simply commit any change, so the database connection takes effect.
6. Optional: delete the old drag-and-drop project, then add your domain to the new one under **Custom domains**.

**To check it works:** `https://<your-site>.pages.dev/api/leaderboard` should show `{"players":[]}` (or a list of players).

From then on, every commit to GitHub rebuilds the site automatically.

## Try it on your computer
```
python -m http.server 8788 --directory public
python scripts/check_questions.py
```
Open http://localhost:8788. Everything works except the shared leaderboard, which shows only players on your own device.

## Child safety notes
- Nicknames are checked against a list of rude words, both on the device and on the server.
- Photos stay on the device unless a grown-up ticks the box allowing them on the public leaderboard. Otherwise the leaderboard shows the child's cartoon character.
- Secret player tokens are stored only as hashes. The leaderboard never returns them.
- There are no accounts, emails or passwords. Progress lives in the browser, so clearing browser data resets it.
- The server caps how much XP a player can gain per save, but a determined person could still fake scores. That's fine for a family site, but it isn't tamper-proof.
