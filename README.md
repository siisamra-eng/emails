# Carbinox Newsletter Studio

A private newsletter planning workspace for Carbinox, designed for deployment on Vercel. The product picker reads the published catalog from the Carbinox storefront and refreshes its cached data hourly. The dashboard reads two years of performance from Klaviyo (in one-year report windows) or uses the ignored local top-50 audit when developing without a Klaviyo key. The generator can create three performance-led concepts with subject, preheader, body copy, CTA, and rationale.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local`. Set `APP_PASSWORD` and a long random `APP_SESSION_SECRET` to enable the private workspace sign-in. Add `OPENAI_API_KEY` to enable generation. Add a Klaviyo private API key with only the `campaigns:read` scope to load two years of performance, the 100 most recent sent campaign names for offer rotation, and actual winning email copy examples for generation. The `campaigns:read` scope is used for read-only campaign and reporting calls. Keys are read server-side only. Without a Klaviyo key, the app uses the local audited top-50 archive when available; without an OpenAI key, generation shows a setup message. Add these same variables in Vercel Project Settings → Environment Variables after deployment.

The GitHub repository is public. The detailed Klaviyo report export stays in the ignored `private-data/` directory and is not bundled in the Vercel deployment. Protect the hosted workspace with its app password and consider Vercel Deployment Protection for an extra layer.

## Deploy to Vercel

Import this GitHub repository as a Vercel project. Vercel detects the Next.js framework and uses the `build` script. `.env.example` lists the server-side environment variables; do not add real credentials to Git.

## Integration design

See the [performance copy rules](docs/performance-copy-rules.md) for the reviewed voice, writing, and accuracy rules. The [data import and Klaviyo plan](docs/import-and-klaviyo-plan.md) describes the next archive-import and persistence steps.

## Brand direction

The Carbinox brand board in this repository is the design reference: dark surfaces, bright yellow accents, bold industrial type, and a direct, field-tested voice.
