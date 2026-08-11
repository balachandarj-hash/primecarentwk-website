# PrimeCare Network Website

Corporate static site for **PrimeCare Network** (Providers Network + Care Coordination), with a **Decap CMS** blog.

Live site: https://www.primecarentwk.com/

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

Build output is written to `_site/` (existing HTML pages are copied through; blog pages are generated).

## Publishing workflow (GoDaddy shared hosting)

1. Locally (or in CI): `npm ci && npm run build`
2. Upload **everything inside `_site/`** into your GoDaddy `public_html/` (domain root) via cPanel File Manager or FTP
3. Do **not** upload `src/`, `content/`, `node_modules/`, or the repo root — only the build output
4. Point DNS for `www.primecarentwk.com` (and apex if desired) to GoDaddy and enable SSL

### Optional: edit content with Decap

1. Open https://www.primecarentwk.com/admin/ (after OAuth proxy is configured)
2. Log in with GitHub (repo collaborators only)
3. Create or edit a **Blog** / **Providers** entry → Publish
4. Decap commits Markdown to `main`
5. Rebuild (`npm run build`) and re-upload `_site/` to GoDaddy

Until OAuth is set up, use **local_backend** + `decap-server` for editorial work, then rebuild and upload.

## Legacy GitHub Pages notes

The previous GitHub Pages deploy used path prefix `/primecarentwk-website/`. This branch is configured for **root-domain** hosting (`pathPrefix: "/"`). Merging to `main` will break the old GitHub Pages URL until DNS/GoDaddy cutover is complete.

## Decap CMS login (OAuth)

Decap’s GitHub backend needs a small OAuth proxy (GitHub does not allow the CMS to complete OAuth by itself on a static host).

1. Create a **GitHub OAuth App**  
   - Homepage URL: `https://www.primecarentwk.com/`  
   - Authorization callback URL: `https://YOUR-OAUTH-PROXY/callback`
2. Deploy an OAuth proxy (examples):  
   - https://github.com/vencax/netlify-cms-github-oauth-provider  
   - https://github.com/Herohtar/netlify-cms-oauth  
   Configure it with the OAuth App client ID/secret.
3. Set `backend.base_url` in [`admin/config.yml`](admin/config.yml) to the proxy origin (no trailing slash), then commit.
4. Invite editors as collaborators on this GitHub repository.

Until OAuth is configured, use **local_backend** + `decap-server` for editorial work.

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
