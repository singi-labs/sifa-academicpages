#!/usr/bin/env node
/**
 * sifa-academicpages build script (Node harness).
 *
 * The renderer is published as @singi-labs/academicpages-renderer -- pure
 * functions (no fs, no fetch) importable by any Node.js script, Next.js Route
 * Handler, or SSG. This repo is the self-hosting scaffold: it fetches data
 * from sifa.id and writes static HTML + assets to dist/.
 *
 * Hybrid data (both public, unauthenticated):
 *   - SDK fetchProfile  -> structured identity (avatar, name, links, verifiedAccounts)
 *   - /p/{handle}.md    -> section bodies, already formatted by Sifa's shared model
 */

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { cpSync } from 'node:fs';
import { fetchProfile } from '@singi-labs/sifa-sdk/query/fetchers';
import { parseSections, renderHome, renderSectionPage, sectionSlug, isSidebarOnly } from '@singi-labs/academicpages-renderer';
import { CSS } from '@singi-labs/academicpages-renderer/style';

const HANDLE = process.env.SIFA_HANDLE ?? process.env.SIFA_DID ?? 'ronentk.me';
const SIFA_BASE = process.env.SIFA_BASE ?? 'https://sifa.id';
const OUT = 'dist';
const config = { baseUrl: SIFA_BASE };

// Build metadata for the footer. On sifa-web's `/academic` route this would be
// the request time (always current); here it is build time (self-hosters update
// on rebuild).
const now = new Date();
const ctx = { year: now.getFullYear(), updated: now.toISOString().slice(0, 10) };

async function fetchText(pathname) {
  const res = await fetch(`${SIFA_BASE}${pathname}`, { redirect: 'follow' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${pathname}`);
  return res.text();
}

async function main() {
  console.log(`Building site for "${HANDLE}" from ${SIFA_BASE}...`);
  const [profile, md] = await Promise.all([
    fetchProfile(config, HANDLE),
    fetchText(`/p/${HANDLE}.md`),
  ]);
  if (!profile && !md) {
    throw new Error(`No public profile for "${HANDLE}" (404 on both SDK profile and .md).`);
  }
  const sections = md ? parseSections(md) : [];
  console.log(`  ${profile?.displayName ?? profile?.handle ?? HANDLE} | avatar: ${profile?.avatar ? 'yes' : 'no'}`);
  console.log(`  sections: ${sections.length} (${sections.map((s) => s.title).join(', ') || 'none'})`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  cpSync('fonts', `${OUT}/fonts`, { recursive: true });
  cpSync('assets', `${OUT}/assets`, { recursive: true });

  await writeFile(`${OUT}/index.html`, renderHome(profile, sections, ctx));
  let pages = 1;
  for (const section of sections) {
    if (section.title.toLowerCase() === 'about') continue; // shown on home
    if (isSidebarOnly(section.title)) continue; // rendered in the sidebar
    await writeFile(`${OUT}/${sectionSlug(section.title)}.html`, renderSectionPage(profile, section, sections, ctx));
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
