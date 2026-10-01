# Verge website

Landing page, waitlist and legal pages for the Verge app, served by GitHub Pages.
Plain HTML and CSS, no build step.

| Page | Path |
|---|---|
| Landing page + waitlist | `index.html` |
| Privacy Policy | `privacy.html` |
| Terms of Use | `terms.html` |
| Delete my account (required by Google Play) | `delete-account.html` |

## Editing
- Contact email, business name, "last updated" date and Supabase settings live in **`assets/config.js`**; pages fill them in. Change them there, not in the HTML.
- Colours and fonts match the app (`assets/styles.css`).

## Waitlist
The forms add emails to the `waitlist` table in the Verge Supabase project (migration in the app repo: `supabase/migrations/*_waitlist.sql`). The website can only **add**; nobody can read the list through the API. View sign-ups in Supabase → Table Editor → `waitlist`.

## Publishing
Settings → Pages → Source: **Deploy from a branch**, branch **main**, folder **/ (root)**.
The site is then at `https://michaelacheampongkwarfo.github.io/Verge-Finance/`.

## Before launch
- Replace the placeholder support email and business name in `assets/config.js`.
- Have the Privacy Policy and Terms reviewed (Ghana Data Protection Act, 2012, Act 843).
