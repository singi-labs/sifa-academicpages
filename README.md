# sifa-page

A personal website generated from your [Sifa](https://sifa.id) profile data, styled after [academicpages.github.io](https://academicpages.github.io/). One Node script fetches your public profile and builds a multi-page static site: a page per section (publications, talks, career, education, awards, and so on), a top nav, and a footer pointing back to Sifa.

No login, no auth. The site is the public visitor view of your profile, rebuilt on every build.

Inspired by [academicpages.github.io](https://academicpages.github.io/), the popular Jekyll template for academic personal sites. This project borrows the layout and information architecture; the implementation is independent and the data source is your Sifa (AT Protocol) profile rather than hand-edited markdown files.

## How it works

The build script fetches the Markdown export of your profile from `https://sifa.id/p/<handle>.md`, splits it into sections, and renders each section as its own HTML page with a shared layout and stylesheet. Empty sections are dropped automatically.

The rendering logic lives in [`@singi-labs/sifa-page-renderer`](https://github.com/singi-labs/sifa-page-renderer) -- this repo is the self-hosting scaffold that fetches data and writes static files.

## Use

```bash
npm install
SIFA_ID=did:plc:xxxxxxxxxxxxxxxxxxxxxxxx npm run build
```

Then preview the generated `dist/` folder:

```bash
npx serve dist
```

Set `SIFA_ID` to your Sifa **DID** or handle. A handle also works:

```bash
SIFA_ID=yourname.example npm run build
```

### Prefer your DID for a site that never breaks

`SIFA_ID` accepts either a DID (`did:plc:...` / `did:web:...`) or a handle. **Use your DID.** A DID is your permanent AT Protocol identity; a handle can change (you might move to a new domain). If you configure a handle and later change it, the build would point at the old, now-dead handle. A DID never changes, and the build resolves your *current* handle from your profile each time it runs -- so a handle change is picked up automatically on the next rebuild, with no config edit.

Find your DID: open your profile on `https://sifa.id`, or resolve your handle at [`resolver.atproto.tools`](https://resolver.atproto.tools/) (enter your handle, copy the `did:plc:...` it returns).

For backward compatibility, `SIFA_DID` and `SIFA_HANDLE` are still read (in that order) if `SIFA_ID` is unset.

## Deploy

`dist/` is plain static HTML and CSS. Deploy it anywhere: GitHub Pages, Netlify, Cloudflare Pages, or your own server. Rebuild on push or on a schedule so the site picks up profile edits.

### Publish to GitHub Pages (no local build)

This repo ships a GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds the site and publishes it to GitHub Pages on every push. To host your own profile this way:

1. **Fork** this repo to your account.
2. In your fork, go to **Settings → Secrets and variables → Actions → Variables** and add a repository variable named `SIFA_ID` set to your Sifa **DID** (`did:plc:...`). A handle works too, but a DID survives handle changes (see above).
3. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Run the workflow: **Actions → Deploy site → Run workflow**, or just push a commit. Your site publishes at `https://<your-username>.github.io/<repo-name>/`.

Profile edits show up the next time the workflow runs. To keep the site current automatically, add a `schedule:` trigger to the workflow (a daily cron, for example) so it rebuilds without a push.

### Use your own domain

GitHub Pages supports custom domains. In your fork, go to **Settings → Pages → Custom domain**, enter your domain (`cv.alice.com`), and add the DNS record GitHub asks for at your DNS provider: a `CNAME` to `<your-username>.github.io` for a subdomain, or the Pages apex records for a root domain. GitHub's [custom-domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) list the exact records. Once it verifies, your site serves from your domain over HTTPS.

This is the domain your website is served from, separate from your [Sifa handle domain](https://docs.sifa.id/docs/use-your-own-domain).

## Using the renderer programmatically

The `@singi-labs/sifa-page-renderer` package is framework-agnostic -- import it from any Node.js script, Next.js Route Handler, or SSG:

```javascript
import { parseSections, renderHome, renderSectionPage } from '@singi-labs/sifa-page-renderer';
import { CSS } from '@singi-labs/sifa-page-renderer/style';
```

See the [package README](https://github.com/singi-labs/sifa-page-renderer) for the full API.

## Status

Proof of concept. The layout, sections, and footer are starting points to adapt to your own style.
