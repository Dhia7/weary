# Sign in with Google — Google Cloud setup (free)

Do this once, then copy values into `backend/.env` (`GOOGLE_CLIENT_ID`) and Vercel (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`).

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External** (unless you use Google Workspace only).
   - App name, user support email, developer contact.
   - Scopes: add **openid**, **email**, **profile** (default is fine).
   - Add **Test users** while the app is in *Testing* if you need accounts outside your own domain.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**.
   - **Authorized JavaScript origins** (required for the popup):
     - `http://localhost:3000`
     - Your production frontend, e.g. `https://your-app.vercel.app`
   - **Authorized redirect URIs**: leave empty for the Google Identity Services (GIS) One Tap / button flow used by this app.
4. Create and copy the **Client ID** (ends with `.apps.googleusercontent.com`). There is no client secret for this flow.
5. Paste the same Client ID into:
   - **Backend** `GOOGLE_CLIENT_ID` (Render / local `.env`) — used to verify the ID token.
   - **Frontend** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Vercel / `frontend/.env.local`) — used by the sign-in button.

After changing env vars, redeploy the backend and rebuild the frontend.

## Production checklist

| Where | Variable | Value |
|-------|----------|--------|
| **Render** (backend) | `GOOGLE_CLIENT_ID` | Same Web client ID from Google Cloud |
| **Vercel** (frontend) | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same value (required at build time) |
| **Vercel** (frontend) | `NEXT_PUBLIC_SITE_URL` | Your public site origin, e.g. `https://your-app.vercel.app` (no trailing slash) — used for metadata / Open Graph |

Redeploy the backend after setting Render env vars. Trigger a new Vercel deployment after adding `NEXT_PUBLIC_GOOGLE_CLIENT_ID` so Next.js inlines it into the client bundle.

### OAuth consent screen: Privacy and Terms URLs

Google Cloud **APIs & Services → OAuth consent screen** should list stable HTTPS links to your live site:

- **Application home page** — your production storefront URL (same origin as the app users see), e.g. `https://your-app.vercel.app`
- **Privacy Policy link** — `https://your-app.vercel.app/privacy`
- **Terms of Service link** — `https://your-app.vercel.app/terms`

Replace `your-app.vercel.app` with your real production hostname. The frontend already serves those paths (`/privacy`, `/terms`).

### After deploy: verify pages

1. In a browser, open `https://<your-host>/privacy` and `https://<your-host>/terms` and confirm both load (no 404).
2. In the OAuth consent screen, paste the same two URLs into **Privacy Policy link** and **Terms of Service link**, then save.

If you change your public hostname, update these URLs in Google Cloud and keep `NEXT_PUBLIC_SITE_URL` on Vercel in sync.
