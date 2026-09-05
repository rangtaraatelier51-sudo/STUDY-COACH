# Study Coach — v1 (Step 1 & 2: design + dashboard)

Zero-cost stack: plain HTML/CSS/JS, no build step, no backend yet.
Data is stored in the browser (`localStorage`) for now — that's what
Step 7 (Supabase) will replace, without needing to change the rest
of the app.

## Run it locally

No install needed. Just open `index.html` in a browser, or serve it
so relative paths behave normally:

```
cd study-coach
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages (free)

1. Create a new GitHub repo:
   - Log into github.com, click the **+** icon top-right → **New repository**.
   - Name it `study-coach`, leave it **Public**, don't add a README (you
     already have one), then click **Create repository**.
2. Push these files to the repo's root (or a `docs/` folder — either works).
   The simplest way without using git commands: on the new repo's page,
   click **Add file → Upload files**, then drag in `index.html`,
   `README.md`, and the whole `css` and `js` folders together, and click
   **Commit changes**.
3. On GitHub: **Settings → Pages → Source** → pick the branch (and
   folder, if you used `docs/`) → Save.
4. GitHub gives you a live URL like
   `https://<your-username>.github.io/study-coach/` within a minute or two.

Every time you push new commits, the live site updates automatically.

## What's built so far

- Dashboard: today's tasks (add/check off), study streak (increments
  once per calendar day you visit), progress %, upcoming exams with
  a days-left countdown (highlighted red inside 7 days).
- Sidebar nav for the rest of the app (Subjects, AI Coach, Quiz,
  Focus Mode) — currently marked "soon", wired up in later steps.
- Mobile-responsive layout.

## Next steps (per the build order)

3. Subjects + tasks — a real Subjects page, tasks linked to subjects
   with chapters.
4. Timetable generator — turn "20 days left, 40% done" into a day-by-day plan.
5. Quiz system — subject/chapter/difficulty picker + question generation.
6. AI coach — natural-language plan requests (rule-based first to
   stay at ₹0; swap in an AI API only once you want it and are
   comfortable with the free-tier limits).
7. Login/database — Supabase Auth + Postgres, replacing localStorage.
8. Mobile polish, then real user testing.
