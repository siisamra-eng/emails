# Carbinox Newsletter Studio

A private newsletter planning workspace for Carbinox, designed for deployment on Vercel. The current screen is a front-end preview; idea generation, authentication, persistence, archive imports, and the Klaviyo connection are not wired up yet.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

Import this GitHub repository as a Vercel project. Vercel detects the Next.js framework and uses the `build` script. Add provider secrets as server-side project environment variables when those integrations are implemented. `.env.example` lists the planned names; do not add real credentials to Git.

## Integration design

See [the data import and Klaviyo plan](docs/import-and-klaviyo-plan.md) for the proposed CSV/email import, source library, read-only campaign sync, reporting, and offer rotation.

## Brand direction

The Carbinox brand board in this repository is the design reference: dark surfaces, bright yellow accents, bold industrial type, and a direct, field-tested voice.
