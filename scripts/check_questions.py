"""Checks the question files in public/questions for mistakes.

Run it yourself with:   python scripts/check_questions.py
GitHub also runs it automatically every time a question file changes.
"""
import csv
import sys
from pathlib import Path

FOLDER = Path(__file__).resolve().parent.parent / "public" / "questions"
COLUMNS = ["level", "question", "answer", "wrong1", "wrong2", "wrong3", "explanation", "hint"]
LEVELS = {"1", "2", "3", "4", "5"}

problems = []
warnings = []
totals = {}

for path in sorted(FOLDER.glob("*.csv")):
    with path.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    if not rows:
        problems.append(f"{path.name}: the file is empty")
        continue
    head = [h.strip().lower() for h in rows[0]]
    missing = [c for c in COLUMNS[:6] if c not in head]
    if missing:
        problems.append(f"{path.name} line 1: missing column(s): {', '.join(missing)}")
        continue
    col = {name: head.index(name) for name in COLUMNS if name in head}
    seen = {}
    per_level = {}
    for n, row in enumerate(rows[1:], start=2):
        get = lambda name: row[col[name]].strip() if name in col and col[name] < len(row) else ""
        if not any(cell.strip() for cell in row):
            continue  # blank line
        where = f"{path.name} line {n}"
        q, a = get("question"), get("answer")
        wrongs = [w for w in (get("wrong1"), get("wrong2"), get("wrong3")) if w]
        level = get("level").lower()
        if not q:
            problems.append(f"{where}: the question is empty")
        if not a:
            problems.append(f"{where}: the answer is empty")
        if len(wrongs) < 2:
            problems.append(f"{where}: needs at least 2 wrong answers (3 is best)")
        if a and a in wrongs:
            problems.append(f"{where}: the right answer “{a}” is also listed as a wrong answer")
        if len(set(wrongs)) != len(wrongs):
            problems.append(f"{where}: two wrong answers are the same")
        if path.name == "general-knowledge.csv":
            if level not in LEVELS | {"all", ""}:
                problems.append(f"{where}: level must be 1–5 or 'all' (found “{level}”)")
        elif level not in LEVELS:
            problems.append(f"{where}: level must be a number from 1 to 5 (found “{level}”)")
        if (q, a) in seen:
            warnings.append(f"{where}: same question and answer as line {seen[(q, a)]}")
        seen[(q, a)] = n
        if not get("explanation"):
            warnings.append(f"{where}: no explanation (optional, but children learn more with one)")
        per_level[level or "all"] = per_level.get(level or "all", 0) + 1
    totals[path.name] = per_level

print("Questions per file and level:")
for name, levels in totals.items():
    detail = ", ".join(f"level {k}: {v}" for k, v in sorted(levels.items()))
    print(f"  {name}: {sum(levels.values())} ({detail})")
    for lv in sorted(LEVELS):
        if name != "general-knowledge.csv" and levels.get(lv, 0) < 10:
            warnings.append(f"{name}: level {lv} has only {levels.get(lv, 0)} questions (10+ makes a full round)")

if warnings:
    print(f"\n{len(warnings)} suggestion(s):")
    for w in warnings:
        print("  •", w)
if problems:
    print(f"\n{len(problems)} problem(s) to fix:")
    for p in problems:
        print("  ✗", p)
    sys.exit(1)
print("\nAll question files look good ✓")
