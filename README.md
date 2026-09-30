# Fake Photo Checker — corrected Cloudflare Pages package

This package is built around the current repository's flat frontend files while fixing the Cloudflare Pages Function routing.

## Structure

```text
fake-photo-checker/
├── index.html
├── report.html
├── main.css
├── app.js
├── report.js
├── functions/
│   └── api/
│       ├── investigate.js
│       └── status.js
└── _headers
```

### Important

Keep your existing `Code.gs` in the GitHub repository. The Apps Script backend is not rewritten by this frontend package.

The existing backend contract remains:

- `POST /api/investigate`
- `GET /api/status?id=...`

Cloudflare Pages Functions proxy those routes to the Apps Script Web App.

## Cloudflare environment variables

Add these in Cloudflare Pages → Settings → Environment variables:

- `APPS_SCRIPT_URL` = your deployed Apps Script `/exec` URL
- `API_SHARED_SECRET` = the same secret stored in Apps Script Script Properties

Do not put the Apps Script URL or secret directly in browser JavaScript.

## Deployment

Use the GitHub repository as the Cloudflare Pages source.

Build command: leave blank if Cloudflare allows it; otherwise use `exit 0`.

Build output directory: `/` or the project root, depending on the Pages UI.

The important requirement is that Cloudflare serves `index.html` from the project root and recognizes `functions/api/*.js` as Pages Functions.

## Backend reminder

Your existing Apps Script backend uses a one-stage-per-trigger queue and requires:

- `VISION_API_KEY`
- optional `API_SHARED_SECRET`
- `setupWorkerTrigger()` run once after deployment

The current Apps Script backend already contains the staged processing flow and should be preserved.
