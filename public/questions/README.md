# Adding questions

Each subject has its own file. Open one, add rows at the bottom, and save (commit). Within a minute or two Cloudflare rebuilds the site and the new questions go live.

| File | Subject | Levels |
|---|---|---|
| `english.csv` | English | 1–5 |
| `science.csv` | Science | 1–5 |
| `tech.csv` | Tech Skills | 1–5 |
| `general-knowledge.csv` | General Knowledge | 1–5 or `all` |

Maths questions are made up automatically, so they don't need a file.

## The columns

| Column | What to put | Required? |
|---|---|---|
| `level` | `1` = Years 1–2, `2` = Years 3–4, `3` = Years 5–6, `4` = Years 7–9, `5` = Years 10–11. For General Knowledge you can also write `all`. | Yes |
| `question` | The question | Yes |
| `answer` | The right answer, exactly as it should appear on the button | Yes |
| `wrong1`, `wrong2`, `wrong3` | Wrong answers. At least 2 are needed; 3 is best. | Yes |
| `explanation` | A fun fact or explanation, shown after the question is answered | Optional, but recommended |
| `hint` | Shown after the first wrong try | Optional |

Example row:

```
2,What is the plural of “mouse”?,mice,mouses,meese,mices,"Some plurals are irregular: mouse → mice, goose → geese.",It changes in the middle.
```

**If a cell contains a comma, put the whole cell in "double quotes"**, like the explanation above. Excel and Google Sheets do this for you automatically.

## Three ways to edit

1. **On GitHub's website:** open the file, click the ✏️ pencil, add your rows, then click **Commit changes**.
2. **In Excel or Google Sheets:** download the file, edit it as a spreadsheet, and save it as **CSV UTF-8**. Then on GitHub, click **Add file → Upload files**, drop it in, and click **Commit changes**. It replaces the old file.
3. **Several questions at once:** paste extra rows from a spreadsheet straight into the file in GitHub's editor.

## Checking for mistakes

Every time you commit a change, GitHub runs a check (see the **Actions** tab). A green ✓ means everything is fine. A red ✗ lists the exact file and line to fix, for example a missing answer or a level that isn't 1–5. The website skips any broken rows, so a mistake never breaks the game.

Aim for **at least 10 questions per level** in each subject so a full round never repeats. If a level has fewer, the game borrows questions from the nearest level.
