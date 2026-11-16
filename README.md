# Karing4Life

Website for Karing4Life, connecting New York families with nurses, caregivers and agencies.

## The site (`app/`)
React + Vite single-page app with two colour themes (Olive, Forest), each in light and dark.

```bash
cd app
npm install
npm run dev      # local dev server on http://localhost:5173
npm run build    # production build in app/dist
```

Hosting: `app/public/_redirects` (Netlify) and `app/vercel.json` (Vercel) send every route to `index.html`.

Checks (need Python + Playwright, against a running dev or preview server):
- `py scripts/functest.py` – end-to-end interactions
- `py scripts/fitcheck.py` – each section fits its window
- `py scripts/perf.py URL` – load and scroll timing

Forms currently only show confirmation messages; they are not connected to a backend yet.

## Legacy
`Karing4Life.html` and `src/` are the earlier single-file version, kept for reference. `assets/` holds the logo files.
