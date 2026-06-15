# Deployment guide

## Local testing
cp .env.example .env
# Fill in all values
npm install
cd netlify/functions && npm install && cd ../..
npx netlify dev
# Visit http://localhost:8888

## Supabase setup
1. Create project at supabase.com
2. Go to SQL Editor → paste supabase-setup.sql → Run
3. Get URL + service_role key from Settings → API

## Resend setup
1. Add and verify the client's domain at resend.com
2. Create an API key
3. Confirm noreply@theirdomain.com is a verified sender

## Deploy to Netlify
1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Build command: npm run build | Publish: dist | Functions: netlify/functions
4. Set all environment variables (from .env.example) in Site settings → Environment variables
5. Trigger redeploy

## Per-client checklist
- [ ] companyConfig.js updated
- [ ] logo.png in /public
- [ ] supabase-setup.sql run
- [ ] Resend domain verified
- [ ] All env vars set in Netlify
- [ ] Test booking submitted
- [ ] Both emails received
- [ ] Supabase row confirmed
