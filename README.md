# GardenWise AI

AI-powered landscape design MVP for California Bay Area USDA Zone 10a water-efficient residential gardens.

## What is included

- Next.js, React, and Tailwind CSS application
- Project creation flow with garden plan upload, site inputs, style selection, and proposal generation
- Seed plant database extracted from the provided Santa Clara Valley Water District qualifying plant PDF
- Automatic 50% mature coverage calculation
- Local recommendation engine that works without an API key
- OpenAI refinement path through `OPENAI_API_KEY`
- PDF plant import endpoint for future database uploads
- Supabase table schema in `lib/supabaseSchema.sql`

## Run locally

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and add keys as needed.

The app still generates a complete proposal without OpenAI or Supabase credentials. Supabase is represented by the schema and can be wired to persistent project storage next.
