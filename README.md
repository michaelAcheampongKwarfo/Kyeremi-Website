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
Custom domain: **vergefinance.app** (Settings → Pages → Custom domain, with Enforce HTTPS). The domain is registered at Cloudflare. Its DNS records point at GitHub Pages and must stay **DNS only** (grey cloud), or GitHub can't issue the HTTPS certificate. The old `michaelacheampongkwarfo.github.io/Verge-Finance/` address redirects here.

The site lives at the domain root, so `404.html` uses root paths (`/assets/...`).

**After changing `styles.css`, `main.js` or `config.js`,** bump the `?v=` tag on their links in every page (e.g. `?v=20261002` → `?v=20261015`). GitHub Pages lets browsers reuse these files for 10 minutes, so without a new tag a returning visitor can get the new page with the old styles, and it looks broken.

## Before launch
- Replace the placeholder support email and business name in `assets/config.js`.
- Have the Privacy Policy and Terms reviewed (Ghana Data Protection Act, 2012, Act 843).

## Where sign-ups come from
Each sign-up can record two things:
- **`heard_from`**: the optional "How did you hear about Verge?" answer.
- **`ref`**: the tag on the link the person arrived from, saved automatically. Tag every link you share:

| Where you share | Link |
|---|---|
| WhatsApp status / groups | `https://vergefinance.app/?ref=whatsapp` |
| TikTok bio | `...?ref=tiktok` |
| Instagram bio | `...?ref=instagram` |
| X (Twitter) | `...?ref=x` |
| A specific post or campaign | `...?ref=tiktok-launch-video` (lowercase letters, numbers, `-` and `_`, up to 40 characters) |

To see the numbers, run this in Supabase → SQL Editor:

```sql
select coalesce(ref, '(no tag)') as link_tag,
       coalesce(heard_from, '(not answered)') as they_said,
       count(*) as signups
from public.waitlist
group by 1, 2
order by signups desc;
```

How many sign-ups are on iPhone (to decide when to build iOS):

```sql
select coalesce(platform, '(not answered)') as phone, count(*) as signups
from public.waitlist
group by 1
order by signups desc;
```
