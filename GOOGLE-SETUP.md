# GOOGLE-SETUP.md — One-time Google Cloud setup

You only do this **once** for all of DropStack. After this, onboarding each new client is just "share your calendar with this email address."

The result you're after: a **service account JSON key file** and your dad's **Calendar ID**.

---

## ⚠️ If you hit "Service account key creation is disabled"

That's Google's **Secure by Default** policy (auto-enforced on Google Cloud setups created after May 2024). On a **personal Gmail**, you're your own admin and can turn it off:

1. Cloud Console top search bar → type **Organization Policies** → open it.
2. In the filter box, paste: `iam.disableServiceAccountKeyCreation`
3. Click **Disable service account key creation** (state shows **Active**).
4. **Manage policy** → set enforcement to **Off** (or **Override** → **Off**).
5. **Set policy** → wait ~10–15 min → retry the key download.

If there's **no Organization Policies page / you have no permission**, your Gmail has no org to manage. In that case we switch to the **OAuth refresh-token** method instead (see the appendix at the bottom) — it avoids service-account keys entirely. Tell me and I'll adjust the kit.

---

## Step-by-step (service account method)

Do this signed in to the **personal Gmail** you want to own DropStack's integrations.

1. **Create a project**
   - Go to `console.cloud.google.com`
   - Top bar → project dropdown → **New Project** → name it `dropstack-calendar` → Create.

2. **Enable the Calendar API**
   - Top search bar → **Google Calendar API** → click it → **Enable**.

3. **Create the service account**
   - Left menu → **APIs & Services → Credentials**
   - **Create Credentials → Service Account**
   - Name: `dropstack-bookings` → **Create and Continue** → skip optional roles → **Done**.

4. **Download the JSON key**
   - Click the new service account → **Keys** tab → **Add Key → Create new key → JSON**.
   - A `.json` file downloads. **This is your credential. Keep it safe. Never commit it to GitHub.**

5. **Grab the two values you need from the JSON**
   - Open the JSON file. You'll use:
     - `client_email` → this becomes `GOOGLE_SERVICE_ACCOUNT_EMAIL`
       (looks like `dropstack-bookings@dropstack-calendar.iam.gserviceaccount.com`)
     - `private_key` → this becomes `GOOGLE_PRIVATE_KEY`
       (a long block starting `-----BEGIN PRIVATE KEY-----`, full of `\n`)

6. **Share your dad's calendar with the service account**
   - Open **Google Calendar** (signed in as your dad, or have him do it).
   - Hover his calendar in the left list → **⋮ → Settings and sharing**.
   - Under **Share with specific people** → **Add people** → paste the `client_email`
     from step 5 → permission: **Make changes to events** → Send/Save.

7. **Grab the Calendar ID**
   - Same settings page → scroll to **Integrate calendar** → copy the **Calendar ID**.
   - For a primary calendar this is usually just the email address. For a secondary
     calendar it's a longer string ending in `@group.calendar.google.com`.
   - This becomes `companyConfig.calendarId` (set in Prompt C).

---

## What you hand off to the build

| Value | From | Goes into |
|---|---|---|
| `client_email` | JSON key | Netlify env: `GOOGLE_SERVICE_ACCOUNT_EMAIL` |
| `private_key` | JSON key | Netlify env: `GOOGLE_PRIVATE_KEY` |
| Calendar ID | Calendar settings | `companyConfig.calendarId` (Prompt C) |

When you've got all three, come back and we'll do the live test.

---

## Onboarding future clients (for reference)

For every new client after your dad:
1. They open their Google Calendar → Settings and sharing.
2. They add the **same** `client_email` with **Make changes to events**.
3. They give you their **Calendar ID**.
4. You set it in their `companyConfig.calendarId` during their Prompt C.

No new Google project, no new key, no OAuth. That's the whole onboarding.

---

## Appendix — OAuth refresh-token method (only if service-account keys are blocked)

If you couldn't disable the policy, we use OAuth instead:
1. Cloud Console → **Credentials → Create Credentials → OAuth client ID** (type: Web app).
2. Add an authorized redirect URI (we'll use a one-time local flow).
3. You do a single consent as the calendar owner to mint a **refresh token**.
4. Env vars become `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.
5. The calendar module mints access tokens from the refresh token instead of JWT.

The rest of the kit (the .ics email, the confirm-flow wiring, the SQL) is identical.
Just tell me "we're going OAuth" and I'll hand you a patched P2 + setup steps.
