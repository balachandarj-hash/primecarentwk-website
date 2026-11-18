# PrimeCare Network Website

Corporate static site for **PrimeCare Network** (Providers Network + Care Coordination), with a **Decap CMS** blog.

Live site: https://primecarentwk.com/

## Local development

```bash
npm install
npm start
```

- Site: http://localhost:8080/
- Blog: http://localhost:8080/blog/
- CMS admin: http://localhost:8080/admin/

### Local CMS editing

In one terminal:

```bash
npm start
```

In another:

```bash
npx --yes decap-server
```

Open `/admin/`, skip GitHub login when prompted for local backend, then create or edit posts under **Blog**. Posts are saved as Markdown in `content/blog/`.

```bash
npm run build
```

Build output is written to `_site/`.

## Custom domain (GitHub Pages)

This site is configured for **https://primecarentwk.com** via GitHub Pages.

### 1. GitHub (one-time)

1. Repo **Settings → Pages**
2. Under **Custom domain**, enter `primecarentwk.com` and save
3. Wait for DNS check, then enable **Enforce HTTPS**

### 2. GoDaddy DNS (one-time)

In GoDaddy DNS for `primecarentwk.com`:

**A records** (apex `@`):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 600 |
| A | @ | 185.199.109.153 | 600 |
| A | @ | 185.199.110.153 | 600 |
| A | @ | 185.199.111.153 | 600 |

**CNAME** for www:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | balachandarj-hash.github.io | 600 |

Remove old A/CNAME records that pointed the site elsewhere (or the old host will keep winning).

### 3. Redirect `doctors.primecarentwk.com` → `/doctors/`

The providers directory lives at **https://primecarentwk.com/doctors/**.  
`doctors.primecarentwk.com` should permanently redirect there.

Today that subdomain still points at the old WordPress host (`173.201.191.155`). Change it in GoDaddy:

1. GoDaddy → **My Products** → **DNS** for `primecarentwk.com`
2. Delete any **A** / **CNAME** / **Forwarding** record for host `doctors` that points to the old server (e.g. `173.201.191.155`)
3. Add **Domain Forwarding** (or **Forwarding** DNS) for the subdomain:
   - **Host / subdomain:** `doctors`
   - **Forward to:** `https://primecarentwk.com/doctors/`
   - **Type:** Permanent (301)
   - **Forward only** (do **not** enable masking)
4. Save and wait for DNS (often a few minutes; can take up to 24–48 hours)

After it propagates, opening `https://doctors.primecarentwk.com` should land on `https://primecarentwk.com/doctors/`.

### Important

Pointing this domain to GitHub Pages will **replace** whatever currently loads at `primecarentwk.com` until you change DNS again.

## Publishing workflow

1. Push/merge to `main`
2. GitHub Action builds and deploys to GitHub Pages
3. Site updates at https://primecarentwk.com/

## Decap CMS login (OAuth)

Decap’s GitHub backend needs a small OAuth proxy.

1. Create a **GitHub OAuth App**
   - Homepage URL: `https://primecarentwk.com/`
   - Authorization callback URL: `https://YOUR-OAUTH-PROXY/callback`
2. Deploy an OAuth proxy and set `backend.base_url` in `admin/config.yml`
3. Invite editors as repo collaborators

Until OAuth is configured, use **local_backend** + `decap-server`.


## Providers directory

The doctors app lives at `/doctors/` (Find Providers). Provider records are Markdown in [`content/providers/`](content/providers/) and can be edited in Decap under **Providers**.

- Directory: `/doctors/` — filter by specialty, city, state
- Profiles: `/doctors/provider/<slug>/`
- Appointment requests open a mailto form to the care team

## Content model

Blog posts live in [`content/blog/`](content/blog/) as Markdown with front matter:

- `title`, `date`, `author`, `summary`, `image`, `imageAlt`, `draft`, body

Featured images upload to [`assets/images/blog/`](assets/images/blog/).

Provider profiles live in [`content/providers/`](content/providers/):

- `title`, `rating`, `clinic`, `phone`, `phoneDisplay`, `specialties`, `cities`, `states`, `addresses`, `draft`, body

## Project structure

| Path | Purpose |
|------|---------|
| `*.html` | Corporate pages (passthrough) |
| `content/blog/` | CMS Markdown posts |
| `src/` | Eleventy templates for blog + sitemap |
| `admin/` | Decap CMS UI |
| `_site/` | Build output (not committed) |
| `.github/workflows/deploy.yml` | Build + Pages deploy |
