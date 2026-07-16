#!/usr/bin/env node
/**
 * sifa-page build script (Node harness).
 *
 * The renderer is published as @singi-labs/sifa-page-renderer -- pure
 * functions (no fs, no fetch) importable by any Node.js script, Next.js Route
 * Handler, or SSG. This repo is the self-hosting scaffold: it fetches data
 * from sifa.id and writes static HTML + assets to dist/.
 *
 * Data (public, unauthenticated):
 *   - SDK fetchProfile -> the structured Profile (identity + section arrays).
 *     buildProfileSections turns it into per-section HTML via the shared SDK
 *     section model -- no `.md` re-parse.
 */

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { cpSync } from 'node:fs';
import { fetchProfile } from '@singi-labs/sifa-sdk/query/fetchers';
import { buildProfileSections, renderHome, renderSectionPage } from '@singi-labs/sifa-page-renderer';
import { CSS } from '@singi-labs/sifa-page-renderer/style';

// Identity input. Accepts EITHER a DID or a handle and prefers the DID: a DID
// (did:plc:..., did:web:...) is permanent, a handle is not. Anchoring the build
// on the DID means a self-hoster who later changes their AT Protocol handle
// doesn't break their site -- the profile (and its current handle, used for the
// renderer's links) is re-resolved from the DID at build time, so the configured
// input never goes stale. SIFA_ID is the recommended unified var; SIFA_DID /
// SIFA_HANDLE stay supported for convenience and backward compat.
const SIFA_ID = process.env.SIFA_ID ?? process.env.SIFA_DID ?? process.env.SIFA_HANDLE ?? 'ronentk.me';
const SIFA_BASE = process.env.SIFA_BASE ?? 'https://sifa.id';
const OUT = 'dist';
const config = { baseUrl: SIFA_BASE };

// Build metadata for the footer. On sifa-web's `/site` route this would be the
// request time (always current); here it is build time (self-hosters update on
// rebuild).
const now = new Date();
const ctx = { year: now.getFullYear(), updated: now.toISOString().slice(0, 10) };

async function main() {
  console.log(`Building site for "${SIFA_ID}" from ${SIFA_BASE}...`);
  // Resolve the profile from the configured identifier (fetchProfile takes a DID
  // or a handle). Sections are built from the structured profile via the shared
  // SDK section model -- no `.md` re-parse.
  const profile = await fetchProfile(config, SIFA_ID);
  if (!profile) {
    throw new Error(`No public profile for "${SIFA_ID}" (404 on the SDK profile).`);
  }
  const handle = profile.handle ?? (SIFA_ID.startsWith('did:') ? null : SIFA_ID);
  const sections = buildProfileSections(profile);
  console.log(`  ${profile.displayName ?? handle ?? SIFA_ID} | avatar: ${profile.avatar ? 'yes' : 'no'}`);
  console.log(`  sections: ${sections.length} (${sections.map((s) => s.title).join(', ') || 'none'})`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  cpSync('fonts', `${OUT}/fonts`, { recursive: true });
  cpSync('assets', `${OUT}/assets`, { recursive: true });

  await writeFile(`${OUT}/index.html`, renderHome(profile, sections, ctx));
  let pages = 1;
  for (const section of sections) {
    if (section.slug === 'index') continue; // About is shown on the home page
    await writeFile(`${OUT}/${section.slug}.html`, renderSectionPage(profile, section, sections, ctx));
    pages++;
  }
  await writeFile(`${OUT}/style.css`, CSS);

  console.log(`\nDone. ${pages} page(s) + assets written to ${OUT}/`);
  console.log('Preview:  npx serve dist');
}

main().catch((err) => {
  console.error(`\nBuild failed: ${err.message}`);
  process.exit(1);
});
