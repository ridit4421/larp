# LARP - Smart Land Acquisition Risk Automation (SIH prototype)

Stack: Next.js, Node.js, Tailwind CSS, Cytoscape.js, Supabase (DB + Auth), Google Gemini, Vercel, GitHub.

## 1. Supabase
1. supabase.com -> New project (region: Mumbai / ap-south-1). Save the database password.
2. SQL Editor -> paste all of `supabase/schema.sql` -> Run.
3. Authentication -> Sign In / Providers -> Email -> turn OFF "Confirm email" (easier for demo).
4. Project Settings -> API Keys: copy the Project URL and the Publishable key (or legacy anon key).
5. (Only for the scheduled cron) copy the secret / service_role key.

## 2. Gemini
aistudio.google.com/app/apikey -> Create API key. Optional: app falls back to rule-based advice.

## 3. Env
    cp .env.example .env.local     (fill values)

## 4. Run
    npm install
    npm run dev

Open http://localhost:3000 -> you land on /login. Sign up, then make yourself admin in the Supabase SQL editor:

    update profiles set role = 'admin' where email = 'you@example.com';

Log out and in again.

## 5. Deploy
Push to GitHub, import in Vercel, add all env variables, deploy.
`vercel.json` runs the automation engine daily at 06:00 UTC (Hobby plan limit). It needs SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET.

## Roles
- admin: everything, edits rules, retrains, manages roles
- officer: runs automation, handles alerts, generates recommendations
- viewer: read-only dashboards

## Notes
Project data is synthetic (lib/data.js). Live project state is held in server memory (resets on cold start); model versions, alerts, rules, audit logs and roles persist in Supabase.
