# PrimeCare Network Website

Corporate static site for **PrimeCare Network** (Providers Network + Care Coordination), with a **Decap CMS** blog.

Live site: https://balachandarj-hash.github.io/primecarentwk-website/

## Local development

```bash
npm install
npm start
```

- Site: http://localhost:8080/primecarentwk-website/
- Blog: http://localhost:8080/primecarentwk-website/blog/
- CMS admin: http://localhost:8080/primecarentwk-website/admin/

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

## Publishing workflow (production)

1. Open https://balachandarj-hash.github.io/primecarentwk-website/admin/
2. Log in with GitHub (repo collaborators only)
3. Create or edit a **Blog** post → Publish
4. Decap commits Markdown to `main`
5. GitHub Action builds the site and deploys to GitHub Pages

## One-time GitHub Pages setup

The deploy workflow uses **GitHub Actions** as the Pages source:

1. Repo **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Merge/push to `main` so `.github/workflows/deploy.yml` can run

## Decap CMS login (OAuth)

Decap’s GitHub backend needs a small OAuth proxy (GitHub does not allow the CMS to complete OAuth by itself on a static host).

1. Create a **GitHub OAuth App**  
   - Homepage URL: `https://balachandarj-hash.github.io/primecarentwk-website/`  
   - Authorization callback URL: `https://YOUR-OAUTH-PROXY/callback`
2. Deploy an OAuth proxy (examples):  
   - https://github.com/vencax/netlify-cms-github-oauth-provider  
   - https://github.com/Herohtar/netlify-cms-oauth  
   Configure it with the OAuth App client ID/secret.
3. Set `backend.base_url` in [`admin/config.yml`](admin/config.yml) to the proxy origin (no trailing slash), then commit.
4. Invite editors as collaborators on this GitHub repository.

Until OAuth is configured, use **local_backend** + `decap-server` for editorial work.

## Content model

Blog posts live in [`content/blog/`](content/blog/) as Markdown with front matter:

- `title`, `date`, `author`, `summary`, `image`, `imageAlt`, `draft`, body

Featured images upload to [`assets/images/blog/`](assets/images/blog/).

## Project structure

| Path | Purpose |
|------|---------|
| `*.html` | Corporate pages (passthrough) |
| `content/blog/` | CMS Markdown posts |
| `src/` | Eleventy templates for blog + sitemap |
| `admin/` | Decap CMS UI |
| `_site/` | Build output (not committed) |
| `.github/workflows/deploy.yml` | Build + Pages deploy |
