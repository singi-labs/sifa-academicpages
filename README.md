# sifa-academicpages

A personal academic website generated from your [Sifa](https://sifa.id) profile data. One Node script fetches your public profile and builds a multi-page, academicpages-style static site: a page per section (publications, talks, career, education, awards, and so on), a top nav, and a footer pointing back to Sifa.

No login, no auth. The site is the public visitor view of your profile, rebuilt on every build.

Inspired by [academicpages.github.io](https://academicpages.github.io/), the popular Jekyll template for academic personal sites. This project borrows the layout and information architecture; the implementation is independent and the data source is your Sifa (AT Protocol) profile rather than hand-edited markdown files.

## How it works

The build script fetches the Markdown export of your profile from `https://sifa.id/p/<handle>.md`, splits it into sections, and renders each section as its own HTML page with a shared layout and stylesheet. Empty sections are dropped automatically.

The rendering logic lives in [`@singi-labs/academicpages-renderer`](https://github.com/singi-labs/academicpages-renderer) -- this repo is the self-hosting scaffold that fetches data and writes static files.

## Use

```bash
npm install
SIFA_HANDLE=yourname.example npm run build
```

Then preview the generated `dist/` folder:

```bash
npx serve dist
```

Set `SIFA_HANDLE` (or `SIFA_DID`) to your Sifa handle. Set `SIFA_BASE` to point at a different Sifa instance.

## Deploy

`dist/` is plain static HTML and CSS. Deploy it anywhere: GitHub Pages, Netlify, Cloudflare Pages, or your own server. Rebuild on push or on a schedule so the site picks up profile edits.

## Using the renderer programmatically

The `@singi-labs/academicpages-renderer` package is framework-agnostic -- import it from any Node.js script, Next.js Route Handler, or SSG:

```javascript
import { parseSections, renderHome, renderSectionPage } from '@singi-labs/academicpages-renderer';
import { CSS } from '@singi-labs/academicpages-renderer/style';
```

See the [package README](https://github.com/singi-labs/academicpages-renderer) for the full API.

## Status

Proof of concept. The layout, sections, and footer are starting points to adapt to your own style.
